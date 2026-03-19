import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MIN_VALID_SIZE = 2000; // bytes

async function main() {
  // Get all bumpers with blob URLs
  const bumpers = await prisma.bumperCache.findMany({
    where: { blobImageUrl: { not: null } },
    select: { id: true, mondayItemId: true, name: true, carMake: true, blobImageUrl: true },
  });

  console.log(`🔍 Checking ${bumpers.length} bumpers with blob images...`);

  let broken = 0;
  let checked = 0;
  const batchSize = 20;

  for (let i = 0; i < bumpers.length; i += batchSize) {
    const batch = bumpers.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (b) => {
        try {
          const res = await fetch(b.blobImageUrl!, { method: "HEAD" });
          const size = parseInt(res.headers.get("content-length") || "0", 10);
          return { ...b, size, valid: size >= MIN_VALID_SIZE };
        } catch {
          return { ...b, size: 0, valid: false };
        }
      })
    );

    for (const r of results) {
      checked++;
      if (!r.valid) {
        broken++;
        console.log(`❌ ${r.name} (${r.carMake}) — ${r.size} bytes`);
        // Clear blob URLs so sync will re-upload
        await prisma.bumperCache.update({
          where: { id: r.id },
          data: { blobImageUrl: null, blobImageUrls: [] },
        });
      }
    }

    if ((i / batchSize) % 10 === 0) {
      process.stdout.write(`  checked ${checked}/${bumpers.length}...\r`);
    }
  }

  console.log(`\n✅ Done! Checked: ${checked} | Broken & cleared: ${broken}`);
  console.log(`   Run sync to re-upload fixed images.`);

  await prisma.$disconnect();
}

main().catch(console.error);
