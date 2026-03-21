import { NextResponse } from "next/server";
import { fetchBumpersFromMonday } from "@/lib/monday";
import type { MondayBumper } from "@/lib/monday";
import { prisma } from "@/lib/prisma";
import { withRetry, mondayCircuit } from "@/lib/resilience";

// Allow up to 120 seconds for full sync (2930+ items from Monday)
export const maxDuration = 120;
import { logger } from "@/lib/logger";
import { notifyAdmin, sendWhatsApp, formatStockAlertMessage } from "@/lib/whatsapp";
import { uploadImageToBlob, downloadImage, isBlobImageValid } from "@/lib/blob";

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
            // price: NOT updated here — preserved from DB (set separately)
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
    // Also detect changed images (new asset IDs) and re-upload
    // Also auto-repair broken blob images (under 2KB)
    let blobUploaded = 0;
    let blobRepaired = 0;
    let blobUpdated = 0;
    const bumpersWithAssets = bumpers.filter((b) => b.imageAssets.length > 0);
    if (bumpersWithAssets.length > 0) {
      // Find which ones don't have blob yet
      const existingBlobs = await prisma.bumperCache.findMany({
        where: {
          mondayItemId: { in: bumpersWithAssets.map((b) => b.mondayItemId) },
        },
        select: { mondayItemId: true, blobImageUrl: true, blobImageUrls: true, imageUrls: true },
      });
      const blobMap = new Map(existingBlobs.map((b) => [b.mondayItemId, b]));

      // Detect asset ID changes: compare current proxy URLs with DB proxy URLs
      // If Monday has new asset IDs, the blob is stale and needs re-upload
      const toUpdate: MondayBumper[] = [];
      for (const b of bumpersWithAssets) {
        const existing = blobMap.get(b.mondayItemId);
        if (existing?.blobImageUrl && existing.blobImageUrls.length > 0) {
          // Compare asset IDs — if Monday has different ones, re-upload
          const oldAssetIds = (existing.imageUrls || [])
            .map((u: string) => u.match(/\/api\/images\/monday\/(\d+)/)?.[1])
            .filter(Boolean)
            .sort()
            .join(",");
          const newAssetIds = b.imageAssets
            .map((a) => a.assetId)
            .sort()
            .join(",");
          if (oldAssetIds && newAssetIds && oldAssetIds !== newAssetIds) {
            toUpdate.push(b);
          }
        }
      }

      // Split into: needs upload (no blob), needs update (asset changed), needs repair (broken)
      const toUpload = bumpersWithAssets
        .filter((b) => {
          const existing = blobMap.get(b.mondayItemId);
          return !existing || !existing.blobImageUrl || existing.blobImageUrls.length === 0;
        })
        .sort((a, b) => {
          // Prioritize in-stock bumpers
          const aInStock = a.status === "במלאי" || a.status === "כן" ? 0 : 1;
          const bInStock = b.status === "במלאי" || b.status === "כן" ? 0 : 1;
          return aInStock - bInStock;
        })
        .slice(0, 80); // max 80 new uploads per sync

      // Check for broken blobs — sample up to 10 per sync
      const toCheckRepair = bumpersWithAssets
        .filter((b) => {
          const existing = blobMap.get(b.mondayItemId);
          return existing && existing.blobImageUrl && existing.blobImageUrls.length > 0;
        })
        .filter((b) => !toUpdate.includes(b))
        .slice(0, 10);

      const toRepair: typeof toCheckRepair = [];
      for (const bumper of toCheckRepair) {
        const existing = blobMap.get(bumper.mondayItemId);
        if (existing?.blobImageUrl) {
          const valid = await isBlobImageValid(existing.blobImageUrl);
          if (!valid) {
            toRepair.push(bumper);
          }
        }
      }

      // Upload new + update changed + repair broken
      const allToProcess = [...toUpload, ...toUpdate.slice(0, 10), ...toRepair];
      for (const bumper of allToProcess) {
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
            if (toUpdate.includes(bumper)) {
              blobUpdated++;
            } else if (toRepair.includes(bumper)) {
              blobRepaired++;
            } else {
              blobUploaded++;
            }
          }
        } catch { /* skip this bumper */ }
      }
    }

    // Mark bumpers removed from Monday as "אזל" (don't delete — preserve data!)
    // Safety: only if we got a substantial response (>200 items = at least 20% of inventory)
    const mondayIds = new Set(bumpers.map((b) => b.mondayItemId));
    let removed = 0;
    if (bumpers.length > 200) {
      for (const existing of existingBumpers) {
        if (!mondayIds.has(existing.mondayItemId) && existing.status !== "אזל" && existing.status !== "לא") {
          try {
            await prisma.bumperCache.update({
              where: { mondayItemId: existing.mondayItemId },
              data: { status: "אזל" },
            });
            removed++;
          } catch { /* non-blocking */ }
        }
      }
    }

    await logger.info("monday_sync", `סנכרון הושלם: ${synced} פריטים, ${blobUploaded} הועלו ל-Blob, ${blobUpdated} עודכנו, ${blobRepaired} תוקנו, ${removed} סומנו כאזל, ${errors} שגיאות, ${alertsSent} התראות מלאי`, {
      total: bumpers.length, synced, blobUploaded, blobUpdated, blobRepaired, removed, errors, alertsSent, backInStock: backInStock.length,
    });

    return NextResponse.json({
      success: true,
      total: bumpers.length,
      synced,
      blobUploaded,
      blobUpdated,
      blobRepaired,
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
