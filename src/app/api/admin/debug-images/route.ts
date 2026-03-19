import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBumpersFromMonday } from "@/lib/monday";
import { uploadImageToBlob, downloadImage } from "@/lib/blob";

// GET /api/admin/debug-images — Debug why image uploads fail
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown>[] = [];

  try {
    // Step 1: Check how many bumpers need blob
    const needBlob = await prisma.bumperCache.count({
      where: { blobImageUrl: null, NOT: { imageUrls: { isEmpty: true } }, status: { in: ["כן", "במלאי"] } },
    });
    results.push({ step: "DB check", needBlob });

    // Step 2: Fetch a small set from Monday to check imageAssets
    const bumpers = await fetchBumpersFromMonday();
    const withAssets = bumpers.filter((b) => b.imageAssets.length > 0);
    const withoutAssets = bumpers.filter((b) => b.imageAssets.length === 0 && b.imageUrls.length > 0);
    results.push({
      step: "Monday fetch",
      totalBumpers: bumpers.length,
      withAssets: withAssets.length,
      withoutAssets: withoutAssets.length,
      sampleWithAssets: withAssets.slice(0, 2).map((b) => ({
        id: b.mondayItemId,
        name: b.catalogNumber,
        assets: b.imageAssets,
        urls: b.imageUrls,
      })),
      sampleWithoutAssets: withoutAssets.slice(0, 2).map((b) => ({
        id: b.mondayItemId,
        name: b.catalogNumber,
        urls: b.imageUrls,
      })),
    });

    // Step 3: Try downloading one image
    const testBumper = withAssets.find((b) => {
      // Find one that doesn't have blob yet
      return true; // just pick the first
    });

    if (testBumper && testBumper.imageAssets[0]) {
      const asset = testBumper.imageAssets[0];
      results.push({ step: "Test download", assetId: asset.assetId, url: asset.publicUrl.substring(0, 100) + "..." });

      try {
        const buffer = await downloadImage(asset.publicUrl);
        results.push({
          step: "Download result",
          success: true,
          size: buffer.length,
          isPlaceholder: buffer.length < 1000,
        });

        // Step 4: Try uploading to blob
        if (buffer.length >= 1000) {
          try {
            const blobUrl = await uploadImageToBlob(asset.assetId, buffer);
            results.push({ step: "Blob upload", success: true, blobUrl });
          } catch (uploadErr) {
            results.push({ step: "Blob upload", success: false, error: String(uploadErr) });
          }
        }
      } catch (dlErr) {
        results.push({ step: "Download result", success: false, error: String(dlErr) });
      }
    }

    // Step 4: Check which bumpers in DB need blob but have assets from Monday
    const dbNoBlobIds = await prisma.bumperCache.findMany({
      where: { blobImageUrl: null, NOT: { imageUrls: { isEmpty: true } }, status: { in: ["כן", "במלאי"] } },
      select: { mondayItemId: true },
      take: 10,
    });
    const noBlobSet = new Set(dbNoBlobIds.map((b) => b.mondayItemId));
    const matchingFromMonday = withAssets.filter((b) => noBlobSet.has(b.mondayItemId));
    results.push({
      step: "Match check",
      dbNoBlobSample: dbNoBlobIds.map((b) => b.mondayItemId),
      matchedInMondayWithAssets: matchingFromMonday.length,
      matchedDetails: matchingFromMonday.map((b) => ({
        id: b.mondayItemId,
        assetsCount: b.imageAssets.length,
      })),
    });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: String(error), results }, { status: 500 });
  }
}
