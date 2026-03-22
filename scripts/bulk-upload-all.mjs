#!/usr/bin/env node
/**
 * Bulk upload ALL Monday images to Vercel Blob.
 * Reads pre-fetched asset URLs from scripts/bulk-assets.json
 * Downloads each image and uploads to Blob CDN.
 *
 * Usage: node scripts/bulk-upload-all.mjs
 */

import dotenv from "dotenv";
dotenv.config();

import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// Concurrency control
const CONCURRENT = 5; // 5 parallel downloads/uploads
const BATCH_REPORT = 50; // Report progress every 50 items

async function downloadImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return buf;
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadToBlob(assetId, buffer) {
  let compressed;
  try {
    compressed = await sharp(buffer, { failOnError: false })
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    // Sharp failed — upload raw JPEG
    compressed = buffer;
  }

  const ext = compressed[0] === 0x52 && compressed[1] === 0x49 ? "webp" : "jpg";
  const contentType = ext === "webp" ? "image/webp" : "image/jpeg";

  const { url } = await put(`bumpers/${assetId}.${ext}`, compressed, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
  return url;
}

async function processItem(mondayItemId, assets) {
  const blobUrls = [];

  // Upload first 4 images max per item
  const toProcess = assets.slice(0, 4);

  for (const asset of toProcess) {
    try {
      const buffer = await downloadImage(asset.url);
      if (buffer.length < 1000) continue; // Skip placeholders
      const blobUrl = await uploadToBlob(asset.id, buffer);
      blobUrls.push(blobUrl);
    } catch {
      // Skip failed individual images
    }
  }

  if (blobUrls.length > 0) {
    await prisma.bumperCache.updateMany({
      where: { mondayItemId },
      data: {
        blobImageUrl: blobUrls[0],
        blobImageUrls: blobUrls,
      },
    });
  }

  return blobUrls.length;
}

async function main() {
  console.log("=== BULK UPLOAD ALL IMAGES TO BLOB ===\n");

  // Load asset map
  const bulkFile = path.join(__dirname, "bulk-assets.json");
  if (!fs.existsSync(bulkFile)) {
    console.error("bulk-assets.json not found! Run Monday fetch first.");
    process.exit(1);
  }

  const { assetMap } = JSON.parse(fs.readFileSync(bulkFile, "utf8"));
  const allIds = Object.keys(assetMap);
  console.log(`Total items with Monday assets: ${allIds.length}`);

  // Check which already have blob
  const existing = await prisma.bumperCache.findMany({
    where: { blobImageUrl: { not: null } },
    select: { mondayItemId: true },
  });
  const existingSet = new Set(existing.map((b) => b.mondayItemId));

  const toUpload = allIds.filter((id) => !existingSet.has(id));
  console.log(`Already have blob: ${existingSet.size}`);
  console.log(`Need upload: ${toUpload.length}\n`);

  if (toUpload.length === 0) {
    console.log("All items already have blob images!");
    await prisma.$disconnect();
    return;
  }

  let uploaded = 0;
  let failed = 0;
  let totalImages = 0;
  const startTime = Date.now();

  // Process in parallel batches
  for (let i = 0; i < toUpload.length; i += CONCURRENT) {
    const batch = toUpload.slice(i, i + CONCURRENT);
    const results = await Promise.allSettled(
      batch.map((id) => processItem(id, assetMap[id]))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value > 0) {
        uploaded++;
        totalImages += result.value;
      } else {
        failed++;
      }
    }

    // Progress report
    const done = i + batch.length;
    if (done % BATCH_REPORT < CONCURRENT || done >= toUpload.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const pct = ((done / toUpload.length) * 100).toFixed(1);
      const rate = (uploaded / (elapsed / 60)).toFixed(1);
      console.log(
        `[${pct}%] ${done}/${toUpload.length} | ✅ ${uploaded} uploaded (${totalImages} images) | ❌ ${failed} failed | ${elapsed}s | ${rate}/min`
      );
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n=== DONE ===`);
  console.log(`Uploaded: ${uploaded} items (${totalImages} images)`);
  console.log(`Failed: ${failed}`);
  console.log(`Time: ${totalElapsed}s`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
