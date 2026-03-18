import { NextResponse } from "next/server";
import { fetchBumpersFromMonday } from "@/lib/monday";
import { prisma } from "@/lib/prisma";
import { withRetry, mondayCircuit } from "@/lib/resilience";
import { logger } from "@/lib/logger";
import { notifyAdmin, sendWhatsApp, formatStockAlertMessage } from "@/lib/whatsapp";
import {
  extractAssetId,
  resolveAssetUrlsBatch,
  downloadImage,
  uploadImageToBlob,
} from "@/lib/blob";

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

    // Auto-upload images to Blob for bumpers that don't have blob URLs yet
    let blobUploaded = 0;
    try {
      const bumpersWithoutBlob = await prisma.bumperCache.findMany({
        where: {
          blobImageUrls: { isEmpty: true },
          imageUrls: { isEmpty: false },
        },
        select: { id: true, name: true, imageUrls: true },
        take: 10, // limit per sync to avoid timeouts
      });

      if (bumpersWithoutBlob.length > 0) {
        // Collect all asset IDs we need to resolve
        const assetIdMap = new Map<string, { bumperId: string; catalogNumber: string; index: number }[]>();
        for (const bumper of bumpersWithoutBlob) {
          for (let i = 0; i < bumper.imageUrls.length; i++) {
            const assetId = extractAssetId(bumper.imageUrls[i]);
            if (assetId) {
              if (!assetIdMap.has(assetId)) assetIdMap.set(assetId, []);
              assetIdMap.get(assetId)!.push({
                bumperId: bumper.id,
                catalogNumber: bumper.name,
                index: i,
              });
            }
          }
        }

        // Resolve all asset IDs to download URLs in one batch call
        const apiKey = process.env.MONDAY_API_KEY;
        if (apiKey && assetIdMap.size > 0) {
          const downloadUrls = await resolveAssetUrlsBatch(
            Array.from(assetIdMap.keys()),
            apiKey
          );

          // Group by bumper and upload
          const bumperBlobUrls = new Map<string, { urls: string[]; catalogNumber: string }>();
          for (const bumper of bumpersWithoutBlob) {
            bumperBlobUrls.set(bumper.id, { urls: [], catalogNumber: bumper.name });
          }

          for (const [assetId, refs] of assetIdMap) {
            const downloadUrl = downloadUrls.get(assetId);
            if (!downloadUrl) continue;

            try {
              const buffer = await downloadImage(downloadUrl);
              for (const ref of refs) {
                const blobPath = `${ref.catalogNumber}/${ref.index + 1}`;
                const blobUrl = await uploadImageToBlob(blobPath, buffer);
                const entry = bumperBlobUrls.get(ref.bumperId);
                if (entry) {
                  // Ensure correct index order
                  entry.urls[ref.index] = blobUrl;
                }
              }
            } catch {
              // Skip this image, continue with others
            }
          }

          // Update DB with blob URLs
          for (const [bumperId, { urls, catalogNumber }] of bumperBlobUrls) {
            const cleanUrls = urls.filter(Boolean);
            if (cleanUrls.length > 0) {
              await prisma.bumperCache.update({
                where: { id: bumperId },
                data: {
                  blobImageUrl: cleanUrls[0],
                  blobImageUrls: cleanUrls,
                },
              });
              blobUploaded++;
              console.log(`Blob: uploaded ${cleanUrls.length} images for [${catalogNumber}]`);
            }
          }
        }
      }
    } catch (err) {
      console.error("Blob auto-upload error:", err);
      // Non-blocking — sync still succeeds
    }

    // Mark bumpers removed from Monday as "אזל" (keep images in Blob)
    // Safety: only mark as removed if we got a reasonable number of items from Monday
    // (prevents marking everything as "אזל" due to API failure/empty response)
    const mondayItemIds = new Set(bumpers.map((b) => b.mondayItemId));
    let removed = 0;
    if (bumpers.length > 50) {
      for (const existing of existingBumpers) {
        if (!mondayItemIds.has(existing.mondayItemId)) {
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

    await logger.info("monday_sync", `סנכרון הושלם: ${synced} פריטים, ${removed} סומנו כאזל, ${blobUploaded} הועלו ל-Blob, ${errors} שגיאות, ${alertsSent} התראות מלאי`, {
      total: bumpers.length, synced, removed, blobUploaded, errors, alertsSent, backInStock: backInStock.length,
    });

    return NextResponse.json({
      success: true,
      total: bumpers.length,
      synced,
      removed,
      blobUploaded,
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
