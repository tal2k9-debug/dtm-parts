/**
 * One-time migration: Download all bumper images from Monday.com
 * and upload them to Vercel Blob.
 *
 * Uses the same fetchBumpersFromMonday() as the sync —
 * public_urls come for free in the response (~30 API calls total).
 *
 * Usage:
 *   npx tsx scripts/migrate-images-to-blob.ts [--dry-run]
 */

import { fetchBumpersFromMonday } from "../src/lib/monday";
import { uploadImageToBlob, downloadImage } from "../src/lib/blob";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`\n🔧 מצב: ${dryRun ? "DRY RUN" : "העלאה אמיתית"}\n`);

  // Step 1: Fetch all bumpers from Monday (uses ~30 API calls)
  console.log("📡 שולף פריטים ממנדיי...");
  const bumpers = await fetchBumpersFromMonday();
  console.log(`   נמצאו ${bumpers.length} פגושים`);

  const withAssets = bumpers.filter((b) => b.imageAssets.length > 0);
  console.log(`   ${withAssets.length} עם תמונות`);

  // Step 2: Find which ones already have blob URLs
  const existingBlobs = await prisma.bumperCache.findMany({
    where: { NOT: { blobImageUrls: { isEmpty: true } } },
    select: { mondayItemId: true },
  });
  const hasBlob = new Set(existingBlobs.map((b) => b.mondayItemId));
  console.log(`   ${hasBlob.size} כבר ב-Blob`);

  const toUpload = withAssets.filter((b) => !hasBlob.has(b.mondayItemId));
  console.log(`   ${toUpload.length} צריכים העלאה\n`);

  if (toUpload.length === 0) {
    console.log("✅ כל התמונות כבר ב-Blob!");
    await prisma.$disconnect();
    return;
  }

  // Step 3: Download and upload
  let uploaded = 0;
  let failed = 0;
  let noImages = 0;

  for (let i = 0; i < toUpload.length; i++) {
    const bumper = toUpload[i];
    const progress = `[${i + 1}/${toUpload.length}]`;

    if (dryRun) {
      console.log(`${progress} [${bumper.catalogNumber}] → ${bumper.imageAssets.length} תמונות (dry run)`);
      uploaded++;
      continue;
    }

    try {
      const blobUrls: string[] = [];

      for (const asset of bumper.imageAssets) {
        try {
          const buffer = await downloadImage(asset.publicUrl);
          if (buffer.length < 1000) continue; // skip tiny placeholders
          const blobUrl = await uploadImageToBlob(asset.assetId, buffer);
          blobUrls.push(blobUrl);
        } catch {
          // skip this image, continue with others
        }
      }

      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { mondayItemId: bumper.mondayItemId },
          data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
        });
        uploaded++;
        console.log(`${progress} ✅ [${bumper.catalogNumber}] ${blobUrls.length} תמונות`);
      } else {
        noImages++;
        console.log(`${progress} ⚠️ [${bumper.catalogNumber}] לא הצליח להוריד תמונות`);
      }
    } catch (err) {
      failed++;
      console.error(`${progress} ❌ [${bumper.catalogNumber}] ${err}`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 סיכום:`);
  console.log(`   הועלו: ${uploaded}`);
  console.log(`   בלי תמונות: ${noImages}`);
  console.log(`   שגיאות: ${failed}`);
  console.log(`   API calls: ~${Math.ceil(bumpers.length / 100)} (פאגינציה בלבד)`);
  console.log(`${"=".repeat(50)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
