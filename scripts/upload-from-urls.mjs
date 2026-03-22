/**
 * Upload images to Blob from a pre-resolved URL map.
 * Reads scripts/resolved-urls.json (assetId→publicUrl map)
 * and uploads all images to Vercel Blob.
 *
 * Usage: node scripts/upload-from-urls.mjs
 */
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const CONCURRENCY = 10

if (!BLOB_TOKEN) { console.error('Missing BLOB_READ_WRITE_TOKEN'); process.exit(1) }

async function downloadImage(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function compressAndUpload(assetId, buffer) {
  const compressed = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/webp',
    allowOverwrite: true,
    token: BLOB_TOKEN,
  })
  return url
}

function extractAssetIds(imageUrls) {
  return imageUrls
    .map(url => url.match(/\/api\/images\/monday\/(\d+)/)?.[1])
    .filter(Boolean)
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('   📤 Upload to Blob from resolved URLs')
  console.log('═══════════════════════════════════════════════════\n')

  // Load URL map
  let urlMap
  try {
    urlMap = JSON.parse(readFileSync('scripts/resolved-urls.json', 'utf8'))
  } catch {
    console.error('❌ scripts/resolved-urls.json not found!')
    console.error('   Generate it first by resolving asset URLs.')
    process.exit(1)
  }
  console.log(`📋 Loaded ${Object.keys(urlMap).length} resolved URLs\n`)

  // Find bumpers needing migration
  const bumpers = await prisma.bumperCache.findMany({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false } },
    select: { id: true, name: true, imageUrls: true },
  })

  console.log(`📦 ${bumpers.length} bumpers need migration\n`)

  let success = 0
  let failed = 0
  let totalImages = 0

  for (let i = 0; i < bumpers.length; i += CONCURRENCY) {
    const batch = bumpers.slice(i, i + CONCURRENCY)

    await Promise.allSettled(batch.map(async (bumper) => {
      const assetIds = extractAssetIds(bumper.imageUrls)
      if (assetIds.length === 0) { failed++; return }

      const blobUrls = []
      for (const assetId of assetIds) {
        const publicUrl = urlMap[assetId]
        if (!publicUrl) continue

        try {
          const buffer = await downloadImage(publicUrl)
          if (buffer.length < 1000) continue
          const blobUrl = await compressAndUpload(assetId, buffer)
          blobUrls.push(blobUrl)
        } catch { /* skip */ }
      }

      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { id: bumper.id },
          data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
        })
        success++
        totalImages += blobUrls.length
        process.stdout.write('✅')
      } else {
        failed++
        process.stdout.write('⚠️')
      }
    }))

    if ((i + CONCURRENCY) % 100 === 0) {
      console.log(` [${i + CONCURRENCY}/${bumpers.length}] (${success} ok)`)
    }
  }

  const finalWithBlob = await prisma.bumperCache.count({ where: { blobImageUrl: { not: null } } })
  const total = await prisma.bumperCache.count()

  console.log(`\n\n═══════════════════════════════════════════════════`)
  console.log(`📊 Done! ${success} bumpers uploaded (${totalImages} images)`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total with Blob: ${finalWithBlob}/${total}`)
  console.log(`═══════════════════════════════════════════════════\n`)

  await prisma.$disconnect()
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
