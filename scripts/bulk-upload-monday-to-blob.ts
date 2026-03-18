/**
 * Bulk upload: Monday.com images → Vercel Blob for all bumpers missing blob URLs.
 *
 * Usage:
 *   npx tsx scripts/bulk-upload-monday-to-blob.ts [--dry-run] [--batch-size 20]
 *
 * Processes bumpers that have Monday image URLs but no blob URLs.
 * Downloads from Monday, compresses to WebP, uploads to Vercel Blob.
 */

import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import sharp from "sharp";

const prisma = new PrismaClient();

const MONDAY_API_URL = "https://api.monday.com/v2";

function extractAssetId(proxyUrl: string): string | null {
  const match = proxyUrl.match(/\/api\/images\/monday\/(\d+)/);
  return match ? match[1] : null;
}

async function resolveAssetIds(
  assetIds: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (assetIds.length === 0) return result;

  // Monday API allows batching asset lookups
  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({
      query: `query { assets(ids: [${assetIds.join(",")}]) { id public_url } }`,
    }),
  });

  const data = await response.json();

  if (data.errors) {
    const errMsg = data.errors[0]?.message || "";
    if (errMsg.includes("DAILY_LIMIT_EXCEEDED")) {
      throw new Error("DAILY_LIMIT_EXCEEDED");
    }
    throw new Error(`Monday API error: ${errMsg}`);
  }

  const assets = data.data?.assets || [];
  for (const asset of assets) {
    if (asset.id && asset.public_url) {
      result.set(String(asset.id), asset.public_url);
    }
  }

  return result;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Skip if too small (likely placeholder/error)
    if (buffer.length < 1000) return null;
    return buffer;
  } catch {
    return null;
  }
}

async function compressAndUpload(
  blobPath: string,
  imageBuffer: Buffer
): Promise<string> {
  const compressed = await sharp(imageBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url } = await put(`bumpers/${blobPath}.webp`, compressed, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
  });

  return url;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const batchSizeIdx = args.indexOf("--batch-size");
  const BATCH_SIZE = batchSizeIdx !== -1 ? parseInt(args[batchSizeIdx + 1]) : 20;

  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) {
    console.error("MONDAY_API_KEY not set");
    process.exit(1);
  }

  console.log(`\n🔧 מצב: ${dryRun ? "DRY RUN" : "העלאה אמיתית"}`);
  console.log(`📦 גודל batch: ${BATCH_SIZE}\n`);

  // Get all bumpers without blob URLs
  const bumpersWithoutBlob = await prisma.bumperCache.findMany({
    where: {
      blobImageUrls: { isEmpty: true },
      imageUrls: { isEmpty: false },
    },
    select: { id: true, name: true, imageUrls: true },
  });

  console.log(`📊 ${bumpersWithoutBlob.length} פגושים בלי Blob URLs\n`);

  if (bumpersWithoutBlob.length === 0) {
    console.log("✅ כל הפגושים כבר ב-Blob!");
    await prisma.$disconnect();
    return;
  }

  let totalUploaded = 0;
  let totalFailed = 0;
  let totalNoImages = 0;

  // Process in batches
  for (let i = 0; i < bumpersWithoutBlob.length; i += BATCH_SIZE) {
    const batch = bumpersWithoutBlob.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(bumpersWithoutBlob.length / BATCH_SIZE);

    console.log(`\n--- Batch ${batchNum}/${totalBatches} (${batch.length} פגושים) ---`);

    // Collect all unique asset IDs in this batch
    const allAssetIds = new Set<string>();
    const bumperAssets = new Map<string, { id: string; name: string; assetIds: (string | null)[] }>();

    for (const bumper of batch) {
      const assetIds = bumper.imageUrls.map((url) => extractAssetId(url));
      bumperAssets.set(bumper.id, { id: bumper.id, name: bumper.name, assetIds });
      for (const aid of assetIds) {
        if (aid) allAssetIds.add(aid);
      }
    }

    if (dryRun) {
      console.log(`  Would resolve ${allAssetIds.size} asset IDs`);
      for (const [, bumper] of bumperAssets) {
        console.log(`  [${bumper.name}] → ${bumper.assetIds.filter(Boolean).length} תמונות`);
      }
      totalUploaded += batch.length;
      continue;
    }

    // Resolve all asset IDs to download URLs
    let downloadUrls: Map<string, string>;
    try {
      downloadUrls = await resolveAssetIds(Array.from(allAssetIds), apiKey);
    } catch (err) {
      if (err instanceof Error && err.message === "DAILY_LIMIT_EXCEEDED") {
        console.error("\n❌ Monday API daily limit exceeded! Stopping.");
        console.log(`   הועלו ${totalUploaded} פגושים לפני העצירה`);
        console.log(`   הרץ שוב מחר להמשך`);
        break;
      }
      console.error(`  Batch error: ${err}`);
      totalFailed += batch.length;
      continue;
    }

    // Process each bumper in the batch
    for (const [, bumper] of bumperAssets) {
      const blobUrls: string[] = [];
      let hasAnyImage = false;

      for (let j = 0; j < bumper.assetIds.length; j++) {
        const assetId = bumper.assetIds[j];
        if (!assetId) continue;

        const downloadUrl = downloadUrls.get(assetId);
        if (!downloadUrl) continue;

        try {
          const buffer = await downloadImage(downloadUrl);
          if (!buffer) continue;

          hasAnyImage = true;
          const blobPath = `${bumper.name}/${j + 1}`;
          const blobUrl = await compressAndUpload(blobPath, buffer);
          blobUrls[j] = blobUrl;
        } catch {
          // Skip this image
        }
      }

      const cleanUrls = blobUrls.filter(Boolean);
      if (cleanUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { id: bumper.id },
          data: {
            blobImageUrl: cleanUrls[0],
            blobImageUrls: cleanUrls,
          },
        });
        totalUploaded++;
        process.stdout.write(`  ✅ [${bumper.name}] ${cleanUrls.length} תמונות\n`);
      } else if (!hasAnyImage) {
        totalNoImages++;
      } else {
        totalFailed++;
      }
    }

    // Rate limit: small pause between batches
    if (i + BATCH_SIZE < bumpersWithoutBlob.length) {
      await sleep(500);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 סיכום:`);
  console.log(`   הועלו בהצלחה: ${totalUploaded}`);
  console.log(`   בלי תמונות: ${totalNoImages}`);
  console.log(`   שגיאות: ${totalFailed}`);
  console.log(`${"=".repeat(50)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
