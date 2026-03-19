/**
 * Blob Migration Script
 * Downloads images from Monday.com assets and uploads to Vercel Blob.
 * Runs in batches to avoid API limits.
 *
 * Usage: npx tsx scripts/blob-migrate.ts [batchSize]
 * Default batch: 50
 */
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import sharp from 'sharp'

const prisma = new PrismaClient()
const MONDAY_API_URL = 'https://api.monday.com/v2'
const BATCH_SIZE = parseInt(process.argv[2] || '50')

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// Blob store base URL — construct URL without re-uploading if already exists
const BLOB_STORE_ID = process.env.BLOB_READ_WRITE_TOKEN?.match(/vercel_blob_rw_([^_]+)/)?.[1] || ''

async function uploadToBlob(assetId: string, buffer: Buffer): Promise<string> {
  const compressed = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  const { url } = await put(`bumpers/${assetId}.webp`, compressed, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/webp',
    allowOverwrite: true,
  })
  return url
}

/**
 * Just link existing Blob URLs to DB records without re-downloading.
 * Constructs the Blob URL from the known pattern.
 */
async function linkExistingBlobs(bumpers: Array<{ id: string; name: string; imageUrls: string[] }>): Promise<number> {
  let linked = 0

  for (const bumper of bumpers) {
    const assetIds = extractAssetIds(bumper.imageUrls)
    if (assetIds.length === 0) continue

    // Try the first asset — check if blob exists
    const testUrl = `https://${BLOB_STORE_ID}.public.blob.vercel-storage.com/bumpers/${assetIds[0]}.webp`
    try {
      const res = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        // All assets for this bumper — construct URLs
        const blobUrls: string[] = []
        for (const id of assetIds) {
          const url = `https://${BLOB_STORE_ID}.public.blob.vercel-storage.com/bumpers/${id}.webp`
          const check = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
          if (check.ok) blobUrls.push(url)
        }

        if (blobUrls.length > 0) {
          await prisma.bumperCache.update({
            where: { id: bumper.id },
            data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
          })
          linked++
          process.stdout.write(`🔗 ${bumper.name}  `)
          if (linked % 10 === 0) console.log()
        }
      }
    } catch { /* skip */ }
  }

  return linked
}

async function resolveAssetUrls(assetIds: string[]): Promise<Map<string, string>> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) throw new Error('MONDAY_API_KEY not set')

  const result = new Map<string, string>()

  // Monday allows max ~100 assets per query
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
        console.error('❌ Monday API daily limit reached! Try again tomorrow.')
        process.exit(1)
      }
      throw new Error(`Monday API: ${msg}`)
    }

    for (const asset of (data.data?.assets || [])) {
      if (asset.id && asset.public_url) {
        result.set(String(asset.id), asset.public_url)
      }
    }

    // Small delay between chunks
    if (i + 100 < assetIds.length) {
      await new Promise(r => setTimeout(r, 500))
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
  console.log('🔄 Blob Migration — Downloading from Monday → Uploading to Vercel Blob')
  console.log(`   Batch size: ${BATCH_SIZE}\n`)

  // Find bumpers that have Monday images but no blob
  const bumpers = await prisma.bumperCache.findMany({
    where: {
      blobImageUrl: null,
      imageUrls: { isEmpty: false },
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
    console.log('✅ All bumpers already have Blob images (or no Monday images to migrate)')

    const stats = await prisma.bumperCache.aggregate({
      _count: { id: true },
    })
    const withBlob = await prisma.bumperCache.count({ where: { blobImageUrl: { not: null } } })
    console.log(`   Total: ${stats._count.id}, With Blob: ${withBlob}`)
    return
  }

  console.log(`📦 Found ${bumpers.length} bumpers to migrate\n`)

  // Phase 1: Try linking existing blobs (no API calls needed!)
  console.log('Phase 1: Linking existing Blob images...')
  const linked = await linkExistingBlobs(bumpers)
  console.log(`\n   Linked ${linked} bumpers to existing Blob images\n`)

  // Re-fetch remaining
  const remaining2 = await prisma.bumperCache.findMany({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false } },
    select: { id: true, mondayItemId: true, name: true, imageUrls: true },
    take: BATCH_SIZE,
  })

  if (remaining2.length === 0) {
    console.log('✅ All done after linking!')
    return
  }

  console.log(`Phase 2: Downloading ${remaining2.length} remaining from Monday...\n`)

  // Collect all unique asset IDs
  const allAssetIds = new Set<string>()
  for (const b of bumpers) {
    for (const id of extractAssetIds(b.imageUrls)) {
      allAssetIds.add(id)
    }
  }

  console.log(`🔍 Resolving ${allAssetIds.size} asset URLs from Monday...`)
  const assetUrlMap = await resolveAssetUrls([...allAssetIds])
  console.log(`   Got ${assetUrlMap.size} valid URLs\n`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (const bumper of bumpers) {
    const assetIds = extractAssetIds(bumper.imageUrls)
    if (assetIds.length === 0) {
      skipped++
      continue
    }

    try {
      const blobUrls: string[] = []

      for (const assetId of assetIds) {
        const publicUrl = assetUrlMap.get(assetId)
        if (!publicUrl) {
          continue
        }

        try {
          const buffer = await downloadImage(publicUrl)
          if (buffer.length < 1000) {
            continue
          }
          const blobUrl = await uploadToBlob(assetId, buffer)
          blobUrls.push(blobUrl)
        } catch (err: any) {
          console.log(`  ⚠️ Image ${assetId}: ${err.message?.substring(0, 50)}`)
        }
      }

      if (blobUrls.length > 0) {
        await prisma.bumperCache.update({
          where: { id: bumper.id },
          data: {
            blobImageUrl: blobUrls[0],
            blobImageUrls: blobUrls,
          },
        })
        success++
        process.stdout.write(`✅ ${bumper.name} (${blobUrls.length} imgs)  `)
        if (success % 5 === 0) console.log()
      } else {
        skipped++
      }
    } catch (err) {
      failed++
      process.stdout.write(`❌ ${bumper.name}  `)
    }
  }

  console.log(`\n\n📊 Results:`)
  console.log(`   ✅ Success: ${success}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)

  // How many remaining?
  const remaining = await prisma.bumperCache.count({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false } },
  })
  if (remaining > 0) {
    console.log(`\n   🔄 ${remaining} bumpers still need migration. Run again!`)
  } else {
    console.log(`\n   🎉 All done! All bumpers have Blob images.`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
