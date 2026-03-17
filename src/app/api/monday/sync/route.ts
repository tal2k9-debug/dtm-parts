import { NextResponse } from "next/server";
import { fetchBumpersFromMonday } from "@/lib/monday";
import { prisma } from "@/lib/prisma";
import { withRetry, mondayCircuit } from "@/lib/resilience";
import { logger } from "@/lib/logger";

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

    await logger.info("monday_sync", `סנכרון הושלם: ${synced} פריטים, ${errors} שגיאות`, {
      total: bumpers.length, synced, errors,
    });

    return NextResponse.json({
      success: true,
      total: bumpers.length,
      synced,
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
