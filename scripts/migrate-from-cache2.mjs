/**
 * Download images using cached Monday public URLs — NO size checks, just overwrite all.
 */
import { put } from "@vercel/blob";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const CONCURRENCY = 5;

function extractAssetId(url) {
  const m = url.match(/\/api\/images\/monday\/(\d+)/);
  return m ? m[1] : null;
}

async function downloadAndUpload(assetId, mondayUrl) {
  const res = await fetch(mondayUrl, { redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`tiny ${buf.length}b`);

  const compressed = await sharp(buf)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: "public", addRandomSuffix: false, allowOverwrite: true,
    contentType: "image/webp", token: BLOB_TOKEN,
  });
  return url;
}

async function main() {
  console.log("=== Quick fix from cached URLs ===\n");

  // Load cached URLs
  const allCache = await prisma.imageCache.findMany();
  const cacheMap = new Map();
  for (const c of allCache) cacheMap.set(c.assetId, c.publicUrl);
  console.log(`${cacheMap.size} cached URLs available.\n`);

  // Get ALL in-stock bumpers (overwrite everything)
  const bumpers = await prisma.bumperCache.findMany({
    where: { status: { in: ["במלאי", "כן"] } },
    orderBy: { lastSynced: "desc" },
  });
  console.log(`${bumpers.length} in-stock bumpers.\n`);

  let success = 0, failed = 0, noCache = 0;

  for (let i = 0; i < bumpers.length; i += CONCURRENCY) {
    const batch = bumpers.slice(i, i + CONCURRENCY);

    await Promise.allSettled(batch.map(async (bumper, j) => {
      const idx = i + j + 1;
      const urls = bumper.imageUrls.length > 0 ? bumper.imageUrls : (bumper.imageUrl ? [bumper.imageUrl] : []);
      const assetIds = urls.map(u => extractAssetId(u)).filter(Boolean);

      if (assetIds.length === 0) { return; }

      const blobUrls = [];
      for (const assetId of assetIds) {
        const mondayUrl = cacheMap.get(assetId);
        if (!mondayUrl) { noCache++; continue; }
        try {
          const blobUrl = await downloadAndUpload(assetId, mondayUrl);
          blobUrls.push(blobUrl);
        } catch { failed++; }
      }

      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { id: bumper.id },
          data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
        });
        success++;
        console.log(`[${idx}/${bumpers.length}] ${bumper.name} — ${blobUrls.length} ✓`);
      }
    }));
  }

  console.log(`\n=== Done! ${success} bumpers fixed | ${failed} images failed | ${noCache} no cache ===`);
  await prisma.$disconnect();
}

main().catch(e => { console.error("Fatal:", e); prisma.$disconnect(); process.exit(1); });
