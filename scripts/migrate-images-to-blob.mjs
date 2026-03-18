/**
 * One-time migration script: Download in-stock bumper images from Monday.com,
 * compress to WebP, upload to Vercel Blob, and update the database.
 *
 * Usage: node scripts/migrate-images-to-blob.mjs
 *
 * Resumable: re-run safely — skips bumpers that already have blobImageUrls.
 * Rate-limited: respects Monday API limits.
 */

import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!MONDAY_API_KEY) {
  console.error("Missing MONDAY_API_KEY in .env");
  process.exit(1);
}
if (!BLOB_TOKEN) {
  console.error("Missing BLOB_READ_WRITE_TOKEN in .env");
  process.exit(1);
}

// --- Helpers ---

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractAssetId(proxyUrl) {
  const match = proxyUrl.match(/\/api\/images\/monday\/(\d+)/);
  return match ? match[1] : null;
}

async function resolveAssetUrlsBatch(assetIds) {
  const idsStr = assetIds.join(",");
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_API_KEY,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({
      query: `query { assets(ids: [${idsStr}]) { id public_url } }`,
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

  const result = new Map();
  const assets = data.data?.assets || [];
  for (const asset of assets) {
    if (asset.id && asset.public_url) {
      result.set(String(asset.id), asset.public_url);
    }
  }
  return result;
}

async function downloadImage(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function compressAndUpload(assetId, imageBuffer) {
  const compressed = await sharp(imageBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/webp",
    token: BLOB_TOKEN,
  });

  return url;
}

// --- Main ---

async function main() {
  console.log("=== DTM Image Migration to Vercel Blob ===\n");

  // 1. Get in-stock bumpers without blob images
  const bumpers = await prisma.bumperCache.findMany({
    where: {
      status: { in: ["במלאי", "כן"] },
      OR: [
        { blobImageUrls: { isEmpty: true } },
        { blobImageUrl: null },
      ],
    },
    orderBy: { lastSynced: "desc" },
  });

  console.log(`Found ${bumpers.length} in-stock bumpers needing image migration.\n`);

  if (bumpers.length === 0) {
    console.log("Nothing to migrate!");
    await prisma.$disconnect();
    return;
  }

  let totalProcessed = 0;
  let totalImages = 0;
  let totalFailed = 0;
  const failures = [];

  for (let i = 0; i < bumpers.length; i++) {
    const bumper = bumpers[i];
    const urls = bumper.imageUrls.length > 0 ? bumper.imageUrls : (bumper.imageUrl ? [bumper.imageUrl] : []);

    // Extract asset IDs from proxy URLs
    const assetEntries = [];
    for (const url of urls) {
      const assetId = extractAssetId(url);
      if (assetId) {
        assetEntries.push({ assetId, originalUrl: url });
      }
    }

    if (assetEntries.length === 0) {
      console.log(`[${i + 1}/${bumpers.length}] ${bumper.name} — no asset IDs, skipping`);
      continue;
    }

    // Resolve asset URLs from Monday API (batch)
    const assetIds = assetEntries.map((e) => e.assetId);
    let urlMap;
    try {
      urlMap = await resolveAssetUrlsBatch(assetIds);
      await sleep(500); // Rate limit Monday API
    } catch (err) {
      if (err.message === "DAILY_LIMIT_EXCEEDED") {
        console.error("\n*** DAILY LIMIT EXCEEDED — stopping. Re-run tomorrow. ***");
        console.log(`Progress: ${totalProcessed}/${bumpers.length} bumpers, ${totalImages} images uploaded.`);
        break;
      }
      console.error(`[${i + 1}] Error resolving URLs for ${bumper.name}: ${err.message}`);
      failures.push({ bumper: bumper.name, error: err.message });
      totalFailed++;
      continue;
    }

    // Download, compress, upload each image
    const blobUrls = [];
    for (const entry of assetEntries) {
      const downloadUrl = urlMap.get(entry.assetId);
      if (!downloadUrl) {
        console.log(`  Asset ${entry.assetId} — no URL from Monday, skipping`);
        continue;
      }

      try {
        const buffer = await downloadImage(downloadUrl);
        const blobUrl = await compressAndUpload(entry.assetId, buffer);
        blobUrls.push(blobUrl);
        totalImages++;
        await sleep(100); // Rate limit downloads
      } catch (err) {
        console.log(`  Asset ${entry.assetId} — failed: ${err.message}`);
        failures.push({ bumper: bumper.name, assetId: entry.assetId, error: err.message });
        totalFailed++;
      }
    }

    // Update DB (with retry for transient connection errors)
    if (blobUrls.length > 0) {
      for (let retry = 0; retry < 3; retry++) {
        try {
          await prisma.bumperCache.update({
            where: { id: bumper.id },
            data: {
              blobImageUrl: blobUrls[0],
              blobImageUrls: blobUrls,
            },
          });
          break;
        } catch (dbErr) {
          if (retry < 2) {
            console.log(`  DB write failed, retrying in 5s... (${dbErr.message.slice(0, 50)})`);
            await sleep(5000);
          } else {
            console.error(`  DB write failed after 3 retries: ${dbErr.message.slice(0, 80)}`);
            failures.push({ bumper: bumper.name, error: "DB write failed" });
            totalFailed++;
          }
        }
      }
    }

    totalProcessed++;
    console.log(
      `[${i + 1}/${bumpers.length}] ${bumper.name} — ${blobUrls.length}/${assetEntries.length} images uploaded`
    );

    // Pause every 100 bumpers
    if (totalProcessed > 0 && totalProcessed % 100 === 0) {
      console.log(`\n--- Pausing 30s after ${totalProcessed} bumpers (${totalImages} images) ---\n`);
      await sleep(30000);
    }
  }

  // Summary
  console.log("\n=== Migration Complete ===");
  console.log(`Bumpers processed: ${totalProcessed}`);
  console.log(`Images uploaded: ${totalImages}`);
  console.log(`Failures: ${totalFailed}`);

  if (failures.length > 0) {
    console.log("\nFailed items:");
    failures.forEach((f) =>
      console.log(`  ${f.bumper} ${f.assetId ? `(asset ${f.assetId})` : ""} — ${f.error}`)
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
