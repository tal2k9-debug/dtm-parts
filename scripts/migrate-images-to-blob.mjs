/**
 * Migration script: Download bumper images via our own proxy (no Monday API credits),
 * compress to WebP, upload to Vercel Blob, and update the database.
 *
 * Usage: node scripts/migrate-images-to-blob.mjs
 *
 * Resumable: re-run safely — skips bumpers that already have blobImageUrls.
 * Does NOT use Monday API — downloads via the site's own proxy endpoint.
 */

import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
// Use production URL to go through our proxy (which resolves Monday URLs)
const SITE_URL = process.env.NEXTAUTH_URL || "https://dtm-parts.vercel.app";

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

async function downloadImageViaProxy(assetId) {
  // Download through our own proxy — this uses our cached Monday URLs
  const url = `${SITE_URL}/api/images/monday/${assetId}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    // Probably an error response
    const json = await response.json();
    throw new Error(json.error || "Proxy returned JSON error");
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
  console.log("=== DTM Image Migration to Vercel Blob (via proxy) ===\n");

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

  console.log(`Found ${bumpers.length} in-stock bumpers needing image migration.`);
  console.log(`Using proxy: ${SITE_URL}\n`);

  if (bumpers.length === 0) {
    console.log("Nothing to migrate!");
    await prisma.$disconnect();
    return;
  }

  let totalProcessed = 0;
  let totalImages = 0;
  let totalFailed = 0;
  let consecutiveErrors = 0;
  const failures = [];

  for (let i = 0; i < bumpers.length; i++) {
    const bumper = bumpers[i];
    const urls = bumper.imageUrls.length > 0 ? bumper.imageUrls : (bumper.imageUrl ? [bumper.imageUrl] : []);

    // Extract asset IDs from proxy URLs
    const assetIds = [];
    for (const url of urls) {
      const assetId = extractAssetId(url);
      if (assetId) {
        assetIds.push(assetId);
      }
    }

    if (assetIds.length === 0) {
      console.log(`[${i + 1}/${bumpers.length}] ${bumper.name} — no asset IDs, skipping`);
      continue;
    }

    // Download each image via proxy, compress, upload to Blob
    const blobUrls = [];
    let bumperFailed = false;

    for (const assetId of assetIds) {
      try {
        const buffer = await downloadImageViaProxy(assetId);
        const blobUrl = await compressAndUpload(assetId, buffer);
        blobUrls.push(blobUrl);
        totalImages++;
        consecutiveErrors = 0;
        await sleep(200); // Be gentle on the proxy
      } catch (err) {
        console.log(`  Asset ${assetId} — failed: ${err.message}`);
        failures.push({ bumper: bumper.name, assetId, error: err.message });
        totalFailed++;
        consecutiveErrors++;
        bumperFailed = true;

        // If too many consecutive errors, pause longer
        if (consecutiveErrors >= 10) {
          console.log(`\n⚠️ 10 consecutive errors — pausing 60s...\n`);
          await sleep(60000);
          consecutiveErrors = 0;
        }
      }
    }

    // Update DB
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
            console.log(`  DB write failed, retrying in 5s...`);
            await sleep(5000);
          } else {
            console.error(`  DB write failed after 3 retries`);
            failures.push({ bumper: bumper.name, error: "DB write failed" });
            totalFailed++;
          }
        }
      }
    }

    totalProcessed++;
    console.log(
      `[${i + 1}/${bumpers.length}] ${bumper.name} — ${blobUrls.length}/${assetIds.length} images uploaded`
    );

    // Pause every 50 bumpers to avoid overloading proxy
    if (totalProcessed > 0 && totalProcessed % 50 === 0) {
      console.log(`\n--- Pause 15s after ${totalProcessed} bumpers (${totalImages} images) ---\n`);
      await sleep(15000);
    }
  }

  // Summary
  console.log("\n=== Migration Complete ===");
  console.log(`Bumpers processed: ${totalProcessed}`);
  console.log(`Images uploaded: ${totalImages}`);
  console.log(`Failures: ${totalFailed}`);

  if (failures.length > 0) {
    console.log(`\nFailed items (${failures.length}):`);
    failures.slice(0, 20).forEach((f) =>
      console.log(`  ${f.bumper} ${f.assetId ? `(asset ${f.assetId})` : ""} — ${f.error}`)
    );
    if (failures.length > 20) {
      console.log(`  ... and ${failures.length - 20} more`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
