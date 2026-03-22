/**
 * Full Blob Migration — Downloads ALL bumper images from Monday.com
 * and uploads to Vercel Blob CDN.
 *
 * Step 1: Resolve all asset IDs via Monday API (~48 API calls)
 * Step 2: Download + compress + upload to Blob (parallel, 10 at a time)
 * Step 3: Update DB with permanent Blob URLs
 *
 * Usage: npx tsx scripts/migrate-all-to-blob.ts
 *
 * After this runs, NO images will use the Monday proxy anymore!
 */
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const MONDAY_API_URL = 'https://api.monday.com/v2'
const CONCURRENCY = 10
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function compressAndUpload(assetId: string, buffer: Buffer): Promise<string> {
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

async function resolveAllAssetUrls(assetIds: string[]): Promise<Map<string, string>> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) throw new Error('MONDAY_API_KEY not set')

  const result = new Map<string, string>()
  const totalChunks = Math.ceil(assetIds.length / 100)

  for (let i = 0; i < assetIds.length; i += 100) {
    const chunk = assetIds.slice(i, i + 100)
    const chunkNum = Math.floor(i / 100) + 1
    process.stdout.write(`\r   Resolving chunk ${chunkNum}/${totalChunks}...`)

    const res = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        query: `query { assets(ids: [${chunk.join(',')}]) { id public_url } }`,
      }),
    })

    const data = await res.json()

    if (data.errors) {
      const msg = data.errors[0]?.message || ''
      if (msg.includes('DAILY_LIMIT_EXCEEDED')) {
        console.error('\n\n❌ Monday API daily limit exceeded!')
        console.error(`   Resolved ${result.size} assets before limit hit.`)
        console.error('   Run again after midnight when limit resets.\n')
        return result
      }
      throw new Error(`Monday API: ${msg}`)
    }

    for (const asset of (data.data?.assets || [])) {
      if (asset.id && asset.public_url) {
        result.set(String(asset.id), asset.public_url)
      }
    }

    // Small delay between API calls
    if (i + 100 < assetIds.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  console.log(`\n   ✅ Resolved ${result.size} asset URLs\n`)
  return result
}

function extractAssetIds(imageUrls: string[]): string[] {
  return imageUrls
    .map(url => url.match(/\/api\/images\/monday\/(\d+)/)?.[1])
    .filter((id): id is string => id !== null)
}

async function processBumper(
  bumper: { id: string; name: string; imageUrls: string[] },
  assetUrlMap: Map<string, string>,
  idx: number,
  total: number,
): Promise<{ success: boolean; count: number }> {
  const assetIds = extractAssetIds(bumper.imageUrls)
  if (assetIds.length === 0) return { success: false, count: 0 }

  const blobUrls: string[] = []

  for (const assetId of assetIds) {
    const publicUrl = assetUrlMap.get(assetId)
    if (!publicUrl) continue

    try {
      const buffer = await downloadImage(publicUrl)
      if (buffer.length < 1000) continue // skip tiny placeholders
      const blobUrl = await compressAndUpload(assetId, buffer)
      blobUrls.push(blobUrl)
    } catch {
      // Skip failed images, continue with others
    }
  }

  if (blobUrls.length > 0) {
    await prisma.bumperCache.update({
      where: { id: bumper.id },
      data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
    })
    process.stdout.write(`✅`)
    if (idx % 50 === 0) console.log(` [${idx}/${total}]`)
    return { success: true, count: blobUrls.length }
  }

  process.stdout.write(`⚠️`)
  return { success: false, count: 0 }
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('   🚀 Full Blob Migration — DTM PARTS')
  console.log('═══════════════════════════════════════════════════\n')

  // Step 0: Stats
  const totalBumpers = await prisma.bumperCache.count()
  const withBlob = await prisma.bumperCache.count({ where: { blobImageUrl: { not: null } } })
  console.log(`📊 Current state: ${withBlob}/${totalBumpers} have Blob images\n`)

  // Step 1: Find all bumpers that need migration
  const bumpers = await prisma.bumperCache.findMany({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false } },
    select: { id: true, name: true, imageUrls: true },
  })

  if (bumpers.length === 0) {
    console.log('🎉 All bumpers already have Blob images! Nothing to do.\n')
    await prisma.$disconnect()
    return
  }

  console.log(`📦 ${bumpers.length} bumpers need migration\n`)

  // Step 2: Collect all unique asset IDs
  const allAssetIds = new Set<string>()
  for (const b of bumpers) {
    for (const id of extractAssetIds(b.imageUrls)) {
      allAssetIds.add(id)
    }
  }
  console.log(`🔍 ${allAssetIds.size} unique asset IDs to resolve (${Math.ceil(allAssetIds.size / 100)} API calls)\n`)

  // Step 3: Resolve all asset IDs to public URLs
  console.log('📡 Resolving asset URLs from Monday...')
  const assetUrlMap = await resolveAllAssetUrls([...allAssetIds])

  if (assetUrlMap.size === 0) {
    console.log('❌ No URLs resolved. Monday API might be limited.\n')
    await prisma.$disconnect()
    return
  }

  // Step 4: Download, compress, upload — in parallel batches
  console.log(`📤 Uploading ${bumpers.length} bumpers to Blob (${CONCURRENCY} parallel)...\n`)

  let totalSuccess = 0
  let totalFailed = 0
  let totalImages = 0

  for (let i = 0; i < bumpers.length; i += CONCURRENCY) {
    const batch = bumpers.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((b, j) => processBumper(b, assetUrlMap, i + j + 1, bumpers.length))
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.success) {
        totalSuccess++
        totalImages += r.value.count
      } else {
        totalFailed++
      }
    }
  }

  // Step 5: Final stats
  const finalWithBlob = await prisma.bumperCache.count({ where: { blobImageUrl: { not: null } } })
  const remaining = await prisma.bumperCache.count({ where: { blobImageUrl: null, imageUrls: { isEmpty: false } } })

  console.log(`\n\n═══════════════════════════════════════════════════`)
  console.log(`📊 Migration Complete!`)
  console.log(`   ✅ Uploaded: ${totalSuccess} bumpers (${totalImages} images)`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📦 Total with Blob: ${finalWithBlob}/${totalBumpers}`)
  if (remaining > 0) {
    console.log(`   🔄 Still remaining: ${remaining} (run again to retry)`)
  } else {
    console.log(`   🎉 ALL bumpers now have Blob images!`)
  }
  console.log(`═══════════════════════════════════════════════════\n`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err)
  prisma.$disconnect()
  process.exit(1)
})
