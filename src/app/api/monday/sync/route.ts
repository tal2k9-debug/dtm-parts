import { NextResponse } from "next/server";
import { fetchBumpersFromMonday } from "@/lib/monday";
import type { MondayBumper } from "@/lib/monday";
import { prisma } from "@/lib/prisma";
import { withRetry, mondayCircuit } from "@/lib/resilience";
import { logger } from "@/lib/logger";
import { notifyAdmin, sendWhatsApp, formatStockAlertMessage } from "@/lib/whatsapp";
import { uploadImageToBlob, downloadImage } from "@/lib/blob";

// GET /api/monday/sync — Sync bumpers from Monday.com
// Can be called by cron job or admin manual trigger
export async function GET(request: Request) {
  try {
    // Auth: cron secret OR admin session
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isDev = !cronSecret;

    if (!isDev && !isValidCron) {
      // Check admin session as fallback
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
      const session = await getServerSession(authOptions);
      const role = (session?.user as Record<string, unknown> | undefined)?.role;
      if (!session || role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const bumpers = await mondayCircuit.execute(() =>
      withRetry(() => fetchBumpersFromMonday(), {
        maxRetries: 2,
        source: "monday_sync",
        operation: "סנכרון מלאי מ-Monday",
      })
    );

    // Get old statuses before upserting (for stock alert comparison)
    const existingBumpers = await prisma.bumperCache.findMany({
      select: { mondayItemId: true, status: true, carMake: true, carModel: true, carYear: true, name: true },
    });
    const oldStatusMap = new Map(existingBumpers.map((b) => [b.mondayItemId, b]));

    // Upsert each bumper into BumperCache
    let synced = 0;
    let errors = 0;
    const backInStock: Array<{ mondayItemId: string; name: string; carMake: string; carModel: string; carYear: string }> = [];

    for (const bumper of bumpers) {
      try {
        // Check if status changed to "במלאי" or "כן"
        const old = oldStatusMap.get(bumper.mondayItemId);
        const isNowInStock = bumper.status === "במלאי" || bumper.status === "כן";
        const wasOutOfStock = old && old.status !== "במלאי" && old.status !== "כן";
        if (isNowInStock && wasOutOfStock) {
          backInStock.push({
            mondayItemId: bumper.mondayItemId,
            name: bumper.catalogNumber,
            carMake: bumper.carMake,
            carModel: bumper.carModel,
            carYear: bumper.carYear,
          });
        }

        await prisma.bumperCache.upsert({
          where: { mondayItemId: bumper.mondayItemId },
          update: {
            name: bumper.catalogNumber,
            carMake: bumper.carMake,
            carModel: bumper.carModel,
            carYear: bumper.carYear,
            position: bumper.position,
            price: null,
            status: bumper.status,
            imageUrl: bumper.imageUrls[0] || null,
            imageUrls: bumper.imageUrls,
          },
          create: {
            mondayItemId: bumper.mondayItemId,
            name: bumper.catalogNumber,
            carMake: bumper.carMake,
            carModel: bumper.carModel,
            carYear: bumper.carYear,
            position: bumper.position,
            price: null,
            status: bumper.status,
            imageUrl: bumper.imageUrls[0] || null,
            imageUrls: bumper.imageUrls,
          },
        });
        synced++;
      } catch (err) {
        console.error(`Failed to upsert bumper ${bumper.mondayItemId}:`, err);
        errors++;
      }
    }

    // Process stock alerts for bumpers that came back in stock
    let alertsSent = 0;
    if (backInStock.length > 0) {
      try {
        for (const bumper of backInStock) {
          // Find matching active alerts
          const matchingAlerts = await prisma.stockAlert.findMany({
            where: {
              active: true,
              carMake: bumper.carMake,
              carModel: bumper.carModel,
              ...(bumper.carYear ? { OR: [{ carYear: bumper.carYear }, { carYear: null }] } : {}),
            },
            include: { user: { select: { name: true, phone: true } } },
          });

          for (const alert of matchingAlerts) {
            try {
              // Send WhatsApp to customer
              if (alert.user.phone) {
                const phone = alert.user.phone.replace(/^0/, "+972").replace(/-/g, "");
                await sendWhatsApp(
                  phone,
                  formatStockAlertMessage({
                    customerName: alert.user.name,
                    carMake: bumper.carMake,
                    carModel: bumper.carModel,
                    carYear: bumper.carYear,
                    bumperName: bumper.name,
                  })
                );
                alertsSent++;
              }

              // Deactivate alert after notification
              await prisma.stockAlert.update({
                where: { id: alert.id },
                data: { active: false },
              });
            } catch { /* non-blocking per alert */ }
          }
        }

        // Notify admin about alerts sent
        if (alertsSent > 0) {
          try {
            await notifyAdmin(
              `📦 ${backInStock.length} טמבונים חזרו למלאי → נשלחו ${alertsSent} התראות ללקוחות`
            );
          } catch { /* non-blocking */ }
        }
      } catch (err) {
        console.error("Stock alert processing error:", err);
      }
    }

    // Auto-upload images to Blob for bumpers without blob URLs
    // Uses publicUrl from sync response — 0 extra API calls
    let blobUploaded = 0;
    const bumpersNeedingBlob = bumpers.filter((b) => b.imageAssets.length > 0);
    if (bumpersNeedingBlob.length > 0) {
      // Find which ones don't have blob yet
      const existingBlobs = await prisma.bumperCache.findMany({
        where: {
          mondayItemId: { in: bumpersNeedingBlob.map((b) => b.mondayItemId) },
          NOT: { blobImageUrls: { isEmpty: true } },
        },
        select: { mondayItemId: true },
      });
      const hasBlob = new Set(existingBlobs.map((b) => b.mondayItemId));

      const toUpload = bumpersNeedingBlob
        .filter((b) => !hasBlob.has(b.mondayItemId))
        .slice(0, 20); // max 20 per sync to avoid timeout

      for (const bumper of toUpload) {
        try {
          const blobUrls: string[] = [];
          for (const asset of bumper.imageAssets) {
            try {
              const buffer = await downloadImage(asset.publicUrl);
              if (buffer.length < 1000) continue; // skip placeholders
              const blobUrl = await uploadImageToBlob(asset.assetId, buffer);
              blobUrls.push(blobUrl);
            } catch { /* skip this image */ }
          }
          if (blobUrls.length > 0) {
            await prisma.bumperCache.update({
              where: { mondayItemId: bumper.mondayItemId },
              data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
            });
            blobUploaded++;
          }
        } catch { /* skip this bumper */ }
      }
    }

    // Mark bumpers removed from Monday as "אזל"
    // Safety: only if we got a real response (>50 items)
    const mondayIds = new Set(bumpers.map((b) => b.mondayItemId));
    let removed = 0;
    if (bumpers.length > 50) {
      for (const existing of existingBumpers) {
        if (!mondayIds.has(existing.mondayItemId)) {
          try {
            await prisma.bumperCache.update({
              where: { mondayItemId: existing.mondayItemId },
              data: { status: "לא" },
            });
            removed++;
          } catch { /* non-blocking */ }
        }
      }
    }

    await logger.info("monday_sync", `סנכרון הושלם: ${synced} פריטים, ${blobUploaded} הועלו ל-Blob, ${removed} סומנו כאזל, ${errors} שגיאות, ${alertsSent} התראות מלאי`, {
      total: bumpers.length, synced, blobUploaded, removed, errors, alertsSent, backInStock: backInStock.length,
    });

    return NextResponse.json({
      success: true,
      total: bumpers.length,
      synced,
      blobUploaded,
      removed,
      errors,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    await logger.error("monday_sync", "סנכרון מ-Monday נכשל", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to sync from Monday.com" },
      { status: 500 }
    );
  }
}
