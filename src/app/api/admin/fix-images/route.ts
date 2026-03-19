import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { uploadImageToBlob, downloadImage, resolveAssetUrlsBatch, extractAssetId, isBlobImageValid } from "@/lib/blob";

// POST /api/admin/fix-images — Re-upload broken/missing blob images for in-stock bumpers
export async function POST(request: Request) {
  // Auth: admin session OR cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isValidCron) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as Record<string, unknown> | undefined)?.role;
    if (!session || role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No Monday API key" }, { status: 500 });
  }

  try {
    // Find in-stock bumpers without blob OR with broken blob
    const bumpers = await prisma.bumperCache.findMany({
      where: {
        status: { in: ["כן", "במלאי"] },
        imageUrls: { isEmpty: false },
      },
      select: {
        id: true,
        mondayItemId: true,
        name: true,
        carMake: true,
        imageUrls: true,
        blobImageUrl: true,
        blobImageUrls: true,
      },
    });

    // Filter: no blob OR broken blob
    const toCheck: typeof bumpers = [];
    const noBlob: typeof bumpers = [];

    for (const b of bumpers) {
      if (!b.blobImageUrl || b.blobImageUrls.length === 0) {
        noBlob.push(b);
      } else {
        toCheck.push(b);
      }
    }

    // Check broken blobs (sample 20)
    const broken: typeof bumpers = [];
    for (const b of toCheck.slice(0, 20)) {
      const valid = await isBlobImageValid(b.blobImageUrl!);
      if (!valid) broken.push(b);
    }

    const toFix = [...noBlob.slice(0, 30), ...broken].slice(0, 40);

    if (toFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All in-stock bumper images are OK",
        totalInStock: bumpers.length,
        noBlob: noBlob.length,
        broken: broken.length,
      });
    }

    // Extract asset IDs from proxy URLs
    const assetIds: string[] = [];
    const assetToBumper = new Map<string, (typeof toFix)[0]>();

    for (const b of toFix) {
      for (const url of b.imageUrls) {
        const assetId = extractAssetId(url);
        if (assetId) {
          assetIds.push(assetId);
          assetToBumper.set(assetId, b);
        }
      }
    }

    // Resolve asset URLs from Monday (batch)
    const urlMap = await resolveAssetUrlsBatch(assetIds, apiKey);

    // Download and upload
    let fixed = 0;
    const bumperBlobs = new Map<string, string[]>();

    for (const [assetId, publicUrl] of urlMap) {
      const bumper = assetToBumper.get(assetId);
      if (!bumper) continue;

      try {
        const buffer = await downloadImage(publicUrl);
        if (buffer.length < 1000) continue;
        const blobUrl = await uploadImageToBlob(assetId, buffer);

        const existing = bumperBlobs.get(bumper.mondayItemId) || [];
        existing.push(blobUrl);
        bumperBlobs.set(bumper.mondayItemId, existing);
      } catch {
        // skip
      }
    }

    // Update DB
    for (const [mondayItemId, blobUrls] of bumperBlobs) {
      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { mondayItemId },
          data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
        });
        fixed++;
      }
    }

    return NextResponse.json({
      success: true,
      totalInStock: bumpers.length,
      noBlob: noBlob.length,
      brokenChecked: Math.min(toCheck.length, 20),
      brokenFound: broken.length,
      fixed,
      remaining: noBlob.length + broken.length - fixed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
