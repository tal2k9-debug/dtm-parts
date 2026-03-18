/**
 * FAST parallel image migration — processes 5 bumpers at a time
 */
import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const SITE_URL = "https://dtm-parts.vercel.app";
const CONCURRENCY = 5; // bumpers in parallel

if (!BLOB_TOKEN) { console.error("Missing BLOB_READ_WRITE_TOKEN"); process.exit(1); }

function extractAssetId(url) {
  const m = url.match(/\/api\/images\/monday\/(\d+)/);
  return m ? m[1] : null;
}

async function processImage(assetId) {
  const url = `${SITE_URL}/api/images/monday/${assetId}`;
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) throw new Error("proxy error");

  const buf = Buffer.from(await res.arrayBuffer());
  const compressed = await sharp(buf)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url: blobUrl } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: "public", addRandomSuffix: false, allowOverwrite: true,
    contentType: "image/webp", token: BLOB_TOKEN,
  });
  return blobUrl;
}

async function processBumper(bumper, idx, total) {
  const urls = bumper.imageUrls.length > 0 ? bumper.imageUrls : (bumper.imageUrl ? [bumper.imageUrl] : []);
  const assetIds = urls.map(u => extractAssetId(u)).filter(Boolean);

  if (assetIds.length === 0) {
    console.log(`[${idx}/${total}] ${bumper.name} — skip (no assets)`);
    return 0;
  }

  // Process all images of this bumper in parallel (up to 3 at a time)
  const blobUrls = [];
  const chunks = [];
  for (let i = 0; i < assetIds.length; i += 3) {
    chunks.push(assetIds.slice(i, i + 3));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map(id => processImage(id)));
    for (const r of results) {
      if (r.status === "fulfilled") blobUrls.push(r.value);
    }
  }

  if (blobUrls.length > 0) {
    await prisma.bumperCache.update({
      where: { id: bumper.id },
      data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
    });
  }

  console.log(`[${idx}/${total}] ${bumper.name} — ${blobUrls.length}/${assetIds.length} ✓`);
  return blobUrls.length;
}

async function main() {
  console.log("=== FAST Migration (5 parallel) ===\n");

  const bumpers = await prisma.bumperCache.findMany({
    where: {
      status: { in: ["במלאי", "כן"] },
      OR: [{ blobImageUrls: { isEmpty: true } }, { blobImageUrl: null }],
    },
    orderBy: { lastSynced: "desc" },
  });

  console.log(`${bumpers.length} bumpers remaining.\n`);
  if (bumpers.length === 0) { console.log("Done!"); await prisma.$disconnect(); return; }

  let totalImages = 0;

  // Process CONCURRENCY bumpers at a time
  for (let i = 0; i < bumpers.length; i += CONCURRENCY) {
    const batch = bumpers.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((b, j) => processBumper(b, i + j + 1, bumpers.length))
    );
    for (const r of results) {
      if (r.status === "fulfilled") totalImages += r.value;
    }
  }

  console.log(`\n=== Done! ${totalImages} images uploaded ===`);
  await prisma.$disconnect();
}

main().catch(e => { console.error("Fatal:", e); prisma.$disconnect(); process.exit(1); });
