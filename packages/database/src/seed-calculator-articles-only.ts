import { PrismaClient } from '@prisma/client';
import { reassignArticleCategories, seedCategoryTree } from './seed-category-tree';
import { seedCalculatorArticles } from './seed-calculator-articles';

const prisma = new PrismaClient();

async function main() {
  const editor = await prisma.user.findFirst({
    where: { email: 'editorial@varnarc.com', deletedAt: null },
    select: { id: true },
  });
  if (!editor) {
    throw new Error('Editor user not found. Run pnpm db:seed first.');
  }

  const categoryIds = await seedCategoryTree(prisma);
  await reassignArticleCategories(prisma, categoryIds);
  await seedCalculatorArticles(prisma, editor.id);
  console.log('Calculator articles and category tree synced.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
