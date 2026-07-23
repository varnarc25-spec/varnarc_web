import { PrismaClient } from '@prisma/client';
import { createRepositories } from '../src/index';

const db = new PrismaClient();
const repos = createRepositories(db);

const modules = [
  'cms',
  'finance',
  'construction',
  'automobile',
  'directory',
  'ai-tools',
  'calculators',
  'reviews',
  'comparisons',
  'media',
  'guides',
] as const;

const MODULE_ENTITY_TYPES = {
  cms: ['ARTICLE', 'PAGE', 'CMS_CATEGORY', 'TAG'],
  finance: ['LOAN', 'BANK', 'CREDIT_CARD', 'INSURANCE'],
  construction: ['MATERIAL', 'BRAND'],
  automobile: ['VEHICLE', 'MANUFACTURER', 'DEALER'],
  directory: ['BUSINESS', 'BUSINESS_SERVICE'],
  'ai-tools': ['AI_TOOL', 'AI_CATEGORY', 'VENDOR'],
  calculators: ['CALCULATOR', 'FORMULA_PAGE'],
  reviews: ['REVIEW'],
  comparisons: ['COMPARISON'],
  media: ['MEDIA'],
  guides: ['GUIDE'],
} as const;

async function main() {
  const summary: Record<string, number> = {};
  for (const mod of modules) {
    await repos.searchIndex.clearModule([...MODULE_ENTITY_TYPES[mod]] as never);
    const count = await repos.searchIndex.reindexModule(mod);
    summary[mod] = count;
    console.log(`reindexed ${mod}: ${count}`);
  }
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  const health = await repos.searchIndex.countsByType();
  console.log(
    JSON.stringify(
      {
        total,
        summary,
        byType: health.map((r) => ({ type: r.entityType, count: r._count._all })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
