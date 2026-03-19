/**
 * Blob Migration for OUT-OF-STOCK bumpers
 * - Max 3 images per bumper (save space)
 * - More compressed (quality 60, max 600px width)
 * - Only processes אזל/לא status bumpers
 *
 * Usage: npx tsx scripts/blob-migrate-outofstock.ts [batchSize]
 * Default batch: 100
 */
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import sharp from 'sharp'

const prisma = new PrismaClient()
const MONDAY_API_URL = 'https://api.monday.com/v2'
const BATCH_SIZE = parseInt(process.argv[2] || '100')
const MAX_IMAGES = 3

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function uploadToBlob(assetId: string, buffer: Buffer): Promise<string> {
  const compressed = await sharp(buffer)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer()

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/webp',
    allowOverwrite: true,
  })
  return url
}

async function resolveAssetUrls(assetIds: string[]): Promise<Map<string, string>> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) throw new Error('MONDAY_API_KEY not set')

  const result = new Map<string, string>()

  for (let i = 0; i < assetIds.length; i += 100) {
    const chunk = assetIds.slice(i, i + 100)
    const idsStr = chunk.join(',')

    const res = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        query: `query { assets(ids: [${idsStr}]) { id public_url } }`,
      }),
    })

    const data = await res.json()

    if (data.errors) {
      const msg = data.errors[0]?.message || ''
      if (msg.includes('DAILY_LIMIT_EXCEEDED')) {
        console.error('\n❌ Monday API daily limit reached! Try again tomorrow.')
        console.error(`   Processed so far — run again to continue.`)
        return result // Return what we have so far
      }
      throw new Error(`Monday API: ${msg}`)
    }

    for (const asset of (data.data?.assets || [])) {
      if (asset.id && asset.public_url) {
        result.set(String(asset.id), asset.public_url)
      }
    }

    if (i + 100 < assetIds.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  return result
}

function extractAssetIds(imageUrls: string[]): string[] {
  return imageUrls
    .map(url => {
      const match = url.match(/\/api\/images\/monday\/(\d+)/)
      return match ? match[1] : null
    })
    .filter((id): id is string => id !== null)
}

async function main() {
  console.log('🔄 Blob Migration — OUT-OF-STOCK bumpers')
  console.log(`   Batch: ${BATCH_SIZE} | Max images: ${MAX_IMAGES} | Quality: 60 | Max width: 600px\n`)

  const bumpers = await prisma.bumperCache.findMany({
    where: {
      blobImageUrl: null,
      imageUrls: { isEmpty: false },
      status: { in: ['אזל', 'לא'] },
    },
    select: {
      id: true,
      mondayItemId: true,
      name: true,
      imageUrls: true,
    },
    take: BATCH_SIZE,
  })

  if (bumpers.length === 0) {
    console.log('✅ All out-of-stock bumpers already migrated!')
    const remaining = await prisma.bumperCache.count({
      where: { blobImageUrl: null, imageUrls: { isEmpty: false }, status: { in: ['אזל', 'לא'] } },
    })
    console.log(`   Remaining: ${remaining}`)
    return
  }

  console.log(`📦 Found ${bumpers.length} out-of-stock bumpers to migrate\n`)

  // Collect asset IDs — max 3 per bumper
  const allAssetIds = new Set<string>()
  const bumperAssets = new Map<string, string[]>()

  for (const b of bumpers) {
    const ids = extractAssetIds(b.imageUrls).slice(0, MAX_IMAGES)
    bumperAssets.set(b.id, ids)
    for (const id of ids) allAssetIds.add(id)
  }

  console.log(`🔍 Resolving ${allAssetIds.size} asset URLs from Monday...`)
  const assetUrlMap = await resolveAssetUrls([...allAssetIds])
  console.log(`   Got ${assetUrlMap.size} valid URLs\n`)

  if (assetUrlMap.size === 0) {
    console.log('❌ No URLs resolved. API might be limited.')
    return
  }

  let success = 0
  let failed = 0
  let skipped = 0

  for (const bumper of bumpers) {
    const assetIds = bumperAssets.get(bumper.id) || []
    if (assetIds.length === 0) { skipped++; continue }

    try {
      const blobUrls: string[] = []

      for (const assetId of assetIds) {
        const publicUrl = assetUrlMap.get(assetId)
        if (!publicUrl) continue

        try {
          const buffer = await downloadImage(publicUrl)
          if (buffer.length < 1000) continue
          const blobUrl = await uploadToBlob(assetId, buffer)
          blobUrls.push(blobUrl)
        } catch (err: any) {
          // Skip silently for out-of-stock
        }
      }

      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { id: bumper.id },
          data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
        })
        success++
        process.stdout.write(`✅ ${bumper.name} (${blobUrls.length})  `)
        if (success % 10 === 0) console.log()
      } else {
        skipped++
      }
    } catch {
      failed++
    }
  }

  const remaining = await prisma.bumperCache.count({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false }, status: { in: ['אזל', 'לא'] } },
  })

  console.log(`\n\n📊 Results:`)
  console.log(`   ✅ Success: ${success}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📦 Remaining: ${remaining}`)
  if (remaining > 0) console.log(`\n   🔄 Run again to continue!`)
  else console.log(`\n   🎉 All out-of-stock bumpers migrated!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
