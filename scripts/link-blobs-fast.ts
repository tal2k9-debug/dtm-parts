/**
 * Fast Blob Linker
 * Links existing Blob images to DB records.
 * No Monday API calls, no re-uploading — just HEAD checks and DB updates.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BLOB_BASE = 'https://igRPCa1fkGgiw16V.public.blob.vercel-storage.com'

function extractAssetIds(imageUrls: string[]): string[] {
  return imageUrls
    .map(url => url.match(/\/api\/images\/monday\/(\d+)/)?.[1])
    .filter((id): id is string => id !== null)
}

async function checkBlobExists(assetId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BLOB_BASE}/bumpers/${assetId}.webp`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  const bumpers = await prisma.bumperCache.findMany({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false } },
    select: { id: true, name: true, imageUrls: true },
  })

  console.log(`🔗 Linking ${bumpers.length} bumpers to existing Blob images...\n`)

  let linked = 0
  let missing = 0
  const missingNames: string[] = []

  // Process in parallel batches of 20
  for (let i = 0; i < bumpers.length; i += 20) {
    const batch = bumpers.slice(i, i + 20)

    await Promise.all(batch.map(async (bumper) => {
      const assetIds = extractAssetIds(bumper.imageUrls)
      if (assetIds.length === 0) { missing++; return }

      // Check first asset only (if it exists, others likely do too)
      const exists = await checkBlobExists(assetIds[0])
      if (!exists) {
        missing++
        missingNames.push(bumper.name)
        return
      }

      // Build blob URLs for all assets
      const blobUrls = assetIds.map(id => `${BLOB_BASE}/bumpers/${id}.webp`)

      await prisma.bumperCache.update({
        where: { id: bumper.id },
        data: { blobImageUrl: blobUrls[0], blobImageUrls: blobUrls },
      })
      linked++
    }))

    process.stdout.write(`  ${i + batch.length}/${bumpers.length} (${linked} linked)\r`)
  }

  console.log(`\n\n📊 Results:`)
  console.log(`   🔗 Linked: ${linked}`)
  console.log(`   ❌ Missing from Blob: ${missing}`)

  if (missingNames.length > 0 && missingNames.length <= 20) {
    console.log(`   Missing: ${missingNames.join(', ')}`)
  }

  const totalWithBlob = await prisma.bumperCache.count({ where: { blobImageUrl: { not: null } } })
  const total = await prisma.bumperCache.count()
  console.log(`\n   Total in DB: ${total}, With Blob: ${totalWithBlob}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
