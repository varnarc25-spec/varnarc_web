import { PrismaClient } from '@prisma/client';
import { seedCalculatorCatalog } from './seed-calculator-catalog';

const prisma = new PrismaClient();

async function main() {
  await seedCalculatorCatalog(prisma);
  const published = await prisma.calculator.count({
    where: { status: 'PUBLISHED', deletedAt: null },
  });
  console.log(`Calculator catalog seed complete. Published calculators: ${published}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
