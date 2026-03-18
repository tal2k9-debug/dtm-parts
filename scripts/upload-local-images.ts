/**
 * Upload local bumper images to Vercel Blob and update the database.
 *
 * Usage:
 *   npx tsx scripts/upload-local-images.ts [--dry-run] [--folder <path>]
 *
 * Default folder: C:\Users\tal2k\OneDrive\שולחן העבודה\קלוד\תמונות מאנדי
 *
 * How it works:
 * 1. Reads all subfolders (named by catalog number) from the images folder
 * 2. For each folder, finds the matching BumperCache record by `name` (= catalog number)
 * 3. Uploads each image to Vercel Blob as compressed WebP
 * 4. Updates blobImageUrl + blobImageUrls in the database
 */

import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const DEFAULT_FOLDER =
  "C:\\Users\\tal2k\\OneDrive\\שולחן העבודה\\קלוד\\תמונות מאנדי";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);

interface UploadResult {
  catalogNumber: string;
  imagesUploaded: number;
  blobUrls: string[];
  error?: string;
}

async function compressAndUpload(
  filePath: string,
  blobPath: string
): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const compressed = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url } = await put(blobPath, compressed, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
  });

  return url;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const folderIdx = args.indexOf("--folder");
  const folder = folderIdx !== -1 ? args[folderIdx + 1] : DEFAULT_FOLDER;

  console.log(`\n📁 תיקיית מקור: ${folder}`);
  console.log(`🔧 מצב: ${dryRun ? "DRY RUN (לא מעלה)" : "העלאה אמיתית"}\n`);

  // Validate folder exists
  if (!fs.existsSync(folder)) {
    console.error(`❌ תיקייה לא נמצאה: ${folder}`);
    process.exit(1);
  }

  // Get all catalog number folders
  const subfolders = fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

  console.log(`📦 נמצאו ${subfolders.length} תיקיות (מספרי קטלוג)\n`);

  // Load all bumpers from DB for matching
  const allBumpers = await prisma.bumperCache.findMany({
    select: { id: true, name: true, blobImageUrl: true, blobImageUrls: true },
  });
  const bumperMap = new Map(allBumpers.map((b) => [b.name, b]));

  console.log(`🗄️  ${allBumpers.length} פגושים ב-DB\n`);

  const results: UploadResult[] = [];
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalNoMatch = 0;

  for (let i = 0; i < subfolders.length; i++) {
    const catalogNumber = subfolders[i];
    const bumper = bumperMap.get(catalogNumber);

    if (!bumper) {
      totalNoMatch++;
      if (totalNoMatch <= 10) {
        console.log(`⚠️  [${catalogNumber}] לא נמצא ב-DB — דילוג`);
      }
      continue;
    }

    // Skip if already has blob images
    if (bumper.blobImageUrls.length > 0) {
      totalSkipped++;
      continue;
    }

    // Get image files in folder
    const folderPath = path.join(folder, catalogNumber);
    const imageFiles = fs
      .readdirSync(folderPath)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort(); // ensures _001, _002, _003 order

    if (imageFiles.length === 0) {
      console.log(`⚠️  [${catalogNumber}] תיקייה ריקה — דילוג`);
      continue;
    }

    const progress = `[${i + 1}/${subfolders.length}]`;

    if (dryRun) {
      console.log(
        `${progress} [${catalogNumber}] → ${imageFiles.length} תמונות (dry run)`
      );
      results.push({
        catalogNumber,
        imagesUploaded: imageFiles.length,
        blobUrls: imageFiles.map((f) => `bumpers/${catalogNumber}/${f}`),
      });
      totalUploaded += imageFiles.length;
      continue;
    }

    // Upload each image
    try {
      const blobUrls: string[] = [];
      for (let j = 0; j < imageFiles.length; j++) {
        const file = imageFiles[j];
        const filePath = path.join(folderPath, file);
        const blobPath = `bumpers/${catalogNumber}/${j + 1}.webp`;

        const url = await compressAndUpload(filePath, blobPath);
        blobUrls.push(url);
      }

      // Update DB
      await prisma.bumperCache.update({
        where: { id: bumper.id },
        data: {
          blobImageUrl: blobUrls[0] || null,
          blobImageUrls: blobUrls,
        },
      });

      console.log(
        `${progress} ✅ [${catalogNumber}] → ${blobUrls.length} תמונות הועלו`
      );
      results.push({ catalogNumber, imagesUploaded: blobUrls.length, blobUrls });
      totalUploaded += blobUrls.length;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`${progress} ❌ [${catalogNumber}] שגיאה: ${errorMsg}`);
      results.push({
        catalogNumber,
        imagesUploaded: 0,
        blobUrls: [],
        error: errorMsg,
      });
      totalErrors++;
    }
  }

  // Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 סיכום:`);
  console.log(`   תמונות שהועלו: ${totalUploaded}`);
  console.log(`   דולגו (כבר ב-Blob): ${totalSkipped}`);
  console.log(`   ללא התאמה ב-DB: ${totalNoMatch}`);
  console.log(`   שגיאות: ${totalErrors}`);
  console.log(`${"=".repeat(50)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
