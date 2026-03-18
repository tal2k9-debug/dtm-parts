/**
 * Download images using cached Monday public URLs from ImageCache table.
 * NO Monday API calls at all — uses URLs already stored in DB.
 */
import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const CONCURRENCY = 5;
const MIN_VALID_SIZE = 5000; // Skip images under 5KB (likely placeholders)

if (!BLOB_TOKEN) { console.error("Missing BLOB_READ_WRITE_TOKEN"); process.exit(1); }

function extractAssetId(url) {
  const m = url.match(/\/api\/images\/monday\/(\d+)/);
  return m ? m[1] : null;
}

async function downloadDirect(url) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_VALID_SIZE) throw new Error(`Too small: ${buf.length}b`);
  return buf;
}

async function compressAndUpload(assetId, imageBuffer) {
  const compressed = await sharp(imageBuffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: "public", addRandomSuffix: false, allowOverwrite: true,
    contentType: "image/webp", token: BLOB_TOKEN,
  });
  return url;
}

async function processBumper(bumper, idx, total, cacheMap) {
  const urls = bumper.imageUrls.length > 0 ? bumper.imageUrls : (bumper.imageUrl ? [bumper.imageUrl] : []);
  const assetIds = urls.map(u => extractAssetId(u)).filter(Boolean);

  if (assetIds.length === 0) return { name: bumper.name, uploaded: 0, total: 0, skipped: true };

  const blobUrls = [];
  for (const assetId of assetIds) {
    // Try cached Monday public URL
    const cachedUrl = cacheMap.get(assetId);
    if (!cachedUrl) continue;

    try {
      const buf = await downloadDirect(cachedUrl);
      const blobUrl = await compressAndUpload(assetId, buf);
      blobUrls.push(blobUrl);
    } catch {
      // Cached URL expired/broken — skip
    }
  }

  if (blobUrls.length > 0) {
    await prisma.bumperCache.update({
      where: { id: bumper.id },
      data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
    });
  }

  console.log(`[${idx}/${total}] ${bumper.name} — ${blobUrls.length}/${assetIds.length} ✓`);
  return { name: bumper.name, uploaded: blobUrls.length, total: assetIds.length };
}

async function main() {
  console.log("=== Migration from cached URLs (no Monday API) ===\n");

  // Load ALL cached URLs from ImageCache
  const allCache = await prisma.imageCache.findMany();
  const cacheMap = new Map();
  for (const c of allCache) {
    cacheMap.set(c.assetId, c.publicUrl);
  }
  console.log(`Loaded ${cacheMap.size} cached URLs from DB.\n`);

  if (cacheMap.size === 0) {
    console.log("No cached URLs found. Need to wait for Monday credit reset.");
    await prisma.$disconnect();
    return;
  }

  // Get bumpers that need real images (have tiny blob images or none)
  const bumpers = await prisma.bumperCache.findMany({
    where: { status: { in: ["במלאי", "כן"] } },
    orderBy: { lastSynced: "desc" },
  });

  // Filter to those that have bad/missing blob images
  const needsFixing = [];
  for (const b of bumpers) {
    if (!b.blobImageUrl || b.blobImageUrls.length === 0) {
      needsFixing.push(b);
      continue;
    }
    // Check if first blob image is a placeholder (under 2KB)
    try {
      const res = await fetch(b.blobImageUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      const size = parseInt(res.headers.get("content-length") || "0");
      if (size < 2000) needsFixing.push(b);
    } catch {
      needsFixing.push(b);
    }
  }

  console.log(`${needsFixing.length} bumpers need real images.\n`);

  if (needsFixing.length === 0) {
    console.log("All good!");
    await prisma.$disconnect();
    return;
  }

  let totalImages = 0;

  for (let i = 0; i < needsFixing.length; i += CONCURRENCY) {
    const batch = needsFixing.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((b, j) => processBumper(b, i + j + 1, needsFixing.length, cacheMap))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) totalImages += r.value.uploaded;
    }
  }

  console.log(`\n=== Done! ${totalImages} real images uploaded ===`);
  await prisma.$disconnect();
}

main().catch(e => { console.error("Fatal:", e); prisma.$disconnect(); process.exit(1); });
