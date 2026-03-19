import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.bumperCache.count()
  const withBlob = await prisma.bumperCache.count({
    where: { blobImageUrl: { not: null } }
  })
  const withMonday = await prisma.bumperCache.count({
    where: { imageUrl: { not: null } }
  })
  const inStock = await prisma.bumperCache.count({
    where: { status: 'כן' }
  })

  console.log(`Total bumpers: ${total}`)
  console.log(`With Blob image: ${withBlob}`)
  console.log(`With Monday image: ${withMonday}`)
  console.log(`In stock: ${inStock}`)
  console.log(`Missing blob: ${withMonday - withBlob}`)

  // Show a few examples
  const sample = await prisma.bumperCache.findMany({
    where: { blobImageUrl: { not: null } },
    take: 3,
    select: { name: true, blobImageUrl: true, imageUrl: true }
  })
  if (sample.length > 0) {
    console.log('\nSample with blob:')
    sample.forEach(s => console.log(`  ${s.name}: ${s.blobImageUrl}`))
  }
}

main().then(() => prisma.$disconnect())
