import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadImageToBlob, downloadImage, resolveAssetUrlsBatch, extractAssetId } from "@/lib/blob";

// POST /api/admin/bulk-upload-images
// Bulk upload missing blob images. Processes in batches.
// Query params: ?batch=50&offset=0&instock=true
export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isValidCron) {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
      const session = await getServerSession(authOptions);
      const role = (session?.user as Record<string, unknown> | undefined)?.role;
      if (!session || role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get("batch") || "30");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const instockOnly = url.searchParams.get("instock") !== "false";

    const apiKey = process.env.MONDAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MONDAY_API_KEY not set" }, { status: 500 });
    }

    // Find bumpers without blob images
    const where: Record<string, unknown> = {
      blobImageUrl: null,
      imageUrls: { isEmpty: false },
    };
    if (instockOnly) {
      where.status = { in: ["כן", "במלאי"] };
    }

    const totalMissing = await prisma.bumperCache.count({ where });

    const bumpers = await prisma.bumperCache.findMany({
      where,
      select: { mondayItemId: true, name: true, imageUrls: true },
      orderBy: { lastSynced: "desc" },
      skip: offset,
      take: batchSize,
    });

    if (bumpers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No bumpers need image upload",
        totalMissing: 0,
        processed: 0,
        uploaded: 0,
      });
    }

    // Extract all asset IDs we need
    const allAssetIds: string[] = [];
    const bumperAssetMap = new Map<string, string[]>();

    for (const b of bumpers) {
      const assetIds: string[] = [];
      for (const url of b.imageUrls) {
        const id = extractAssetId(url);
        if (id) {
          assetIds.push(id);
          allAssetIds.push(id);
        }
      }
      bumperAssetMap.set(b.mondayItemId, assetIds);
    }

    // Resolve all asset IDs to download URLs in one batch API call
    let assetUrlMap = new Map<string, string>();
    try {
      // Monday API can handle ~100 asset IDs per call
      const chunks: string[][] = [];
      for (let i = 0; i < allAssetIds.length; i += 100) {
        chunks.push(allAssetIds.slice(i, i + 100));
      }

      for (const chunk of chunks) {
        const partial = await resolveAssetUrlsBatch(chunk, apiKey);
        for (const [k, v] of partial) {
          assetUrlMap.set(k, v);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("DAILY_LIMIT_EXCEEDED")) {
        return NextResponse.json({
          error: "Monday API daily limit reached. Try again tomorrow.",
          totalMissing,
          processed: 0,
          uploaded: 0,
        }, { status: 429 });
      }
      throw err;
    }

    // Download and upload each bumper's images
    let uploaded = 0;
    let failed = 0;
    const results: Array<{ id: string; name: string; status: string }> = [];

    for (const bumper of bumpers) {
      const assetIds = bumperAssetMap.get(bumper.mondayItemId) || [];
      const blobUrls: string[] = [];

      for (const assetId of assetIds) {
        const downloadUrl = assetUrlMap.get(assetId);
        if (!downloadUrl) continue;

        try {
          const buffer = await downloadImage(downloadUrl);
          if (buffer.length < 1000) continue; // skip broken/placeholder
          const blobUrl = await uploadImageToBlob(assetId, buffer);
          blobUrls.push(blobUrl);
        } catch {
          // skip this image
        }
      }

      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { mondayItemId: bumper.mondayItemId },
          data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
        });
        uploaded++;
        results.push({ id: bumper.mondayItemId, name: bumper.name, status: "uploaded" });
      } else {
        failed++;
        results.push({ id: bumper.mondayItemId, name: bumper.name, status: "failed" });
      }
    }

    const remaining = totalMissing - offset - bumpers.length;

    return NextResponse.json({
      success: true,
      totalMissing,
      processed: bumpers.length,
      uploaded,
      failed,
      remaining: Math.max(0, remaining),
      nextOffset: offset + batchSize,
      message: remaining > 0
        ? `Uploaded ${uploaded}/${bumpers.length}. Run again with offset=${offset + batchSize} for next batch.`
        : `Done! Uploaded ${uploaded}/${bumpers.length}.`,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
