import { NextResponse } from "next/server";
import { fetchBumpersFromMonday } from "@/lib/monday";
import { prisma } from "@/lib/prisma";

// GET /api/monday/sync — Sync bumpers from Monday.com
// Can be called by cron job or admin manual trigger
export async function GET(request: Request) {
  try {
    // Simple auth check via header for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow if: no cron secret set (dev), or matching secret, or called from admin
    const referer = request.headers.get("referer") || "";
    const isAdmin = referer.includes("/admin");
    const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isDev = !cronSecret;

    if (!isDev && !isValidCron && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bumpers = await fetchBumpersFromMonday();

    // Upsert each bumper into BumperCache
    let synced = 0;
    let errors = 0;

    for (const bumper of bumpers) {
      try {
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

    return NextResponse.json({
      success: true,
      total: bumpers.length,
      synced,
      errors,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Monday sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync from Monday.com" },
      { status: 500 }
    );
  }
}
