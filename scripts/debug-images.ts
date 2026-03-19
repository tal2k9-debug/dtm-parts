import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get 5 bumpers without blob but with images
  const bumpers = await prisma.bumperCache.findMany({
    where: { blobImageUrl: null, imageUrls: { isEmpty: false } },
    take: 5,
    select: { name: true, imageUrls: true, imageUrl: true, mondayItemId: true },
  })

  for (const b of bumpers) {
    console.log(`\n--- ${b.name} (monday: ${b.mondayItemId}) ---`)
    console.log(`  imageUrl: ${b.imageUrl}`)
    console.log(`  imageUrls: ${JSON.stringify(b.imageUrls)}`)

    // Try extracting asset IDs
    for (const url of b.imageUrls) {
      const match = url.match(/\/api\/images\/monday\/(\d+)/)
      if (match) {
        console.log(`  → Asset ID: ${match[1]}`)
      } else {
        console.log(`  → No asset ID match: ${url.substring(0, 80)}`)
      }
    }

    // Try downloading the first image URL directly
    if (b.imageUrls[0]) {
      try {
        const testUrl = b.imageUrls[0]
        if (testUrl.startsWith('/api/')) {
          console.log(`  ⚠️  URL is a proxy path, not downloadable directly`)
        } else {
          const res = await fetch(testUrl, { signal: AbortSignal.timeout(5000) })
          console.log(`  Download test: ${res.status} ${res.statusText}, size: ${res.headers.get('content-length')}`)
        }
      } catch (err: any) {
        console.log(`  Download test failed: ${err.message}`)
      }
    }
  }
}

main().then(() => prisma.$disconnect())
