import type { PrismaClient } from '@prisma/client';

const ROOT_CATEGORIES = [
  { slug: 'finance', name: 'Finance', description: 'Loans, tax, insurance, and investments' },
  { slug: 'home-construction', name: 'Home & Construction', description: 'Building, materials, and interiors' },
  { slug: 'automobiles', name: 'Automobiles', description: 'Cars, maintenance, and buying guides' },
  { slug: 'solar-energy', name: 'Solar & Energy', description: 'Solar panels, inverters, and savings' },
  { slug: 'tools', name: 'Tools & Calculators', description: 'Calculators and utility guides' },
] as const;

const SUBCATEGORIES: Array<{
  slug: string;
  name: string;
  parentSlug: string;
  description?: string;
}> = [
  { slug: 'home-loans', name: 'Home Loans', parentSlug: 'finance', description: 'EMI, eligibility, prepayment, and lender guides' },
  { slug: 'personal-loans', name: 'Personal Loans', parentSlug: 'finance', description: 'Unsecured borrowing, rates, and eligibility' },
  { slug: 'car-loans', name: 'Car Loans', parentSlug: 'finance', description: 'Vehicle financing, down payment, and dealer offers' },
  { slug: 'education-loans', name: 'Education Loans', parentSlug: 'finance', description: 'Student loans, moratorium, and tax benefits' },
  { slug: 'tax-planning', name: 'Tax Planning', parentSlug: 'finance', description: 'Income tax, GST, deductions, and ITR filing' },
  { slug: 'insurance', name: 'Insurance', parentSlug: 'finance', description: 'Life, health, and motor insurance guides' },
  { slug: 'investments', name: 'Investments', parentSlug: 'finance', description: 'SIP, mutual funds, NPS, PPF, and retirement' },
  { slug: 'calculator-guides', name: 'Calculator Guides', parentSlug: 'tools', description: 'How-to articles for Varnarc calculators' },
];

/** Slug prefix or exact slug → subcategory slug for reassigning seeded articles. */
const ARTICLE_CATEGORY_BY_SLUG: Array<{ match: RegExp; categorySlug: string }> = [
  { match: /^home-loan/, categorySlug: 'home-loans' },
  { match: /^best-home-loan/, categorySlug: 'home-loans' },
  { match: /^how-to-buy-first-house/, categorySlug: 'home-loans' },
  { match: /^personal-loan/, categorySlug: 'personal-loans' },
  { match: /^gold-loan-vs-personal/, categorySlug: 'personal-loans' },
  { match: /^car-loan/, categorySlug: 'car-loans' },
  { match: /^education-loan/, categorySlug: 'education-loans' },
  { match: /^income-tax|^gst-|^tax-saving|^how-to-save-income-tax|^income-tax-new|^gst-for-small/, categorySlug: 'tax-planning' },
  { match: /^term-insurance|^health-insurance/, categorySlug: 'insurance' },
  { match: /^sip-|^what-is-nps|^nps-|^mutual-fund|^ppf-|^retirement-|^credit-card/, categorySlug: 'investments' },
  { match: /^emi-calculator|^gst-calculator|^paint-calculator|^tile-calculator|^budget-planner|^calculator-guide/, categorySlug: 'calculator-guides' },
];

export function resolveArticleCategorySlug(articleSlug: string, fallbackSlug: string): string {
  for (const rule of ARTICLE_CATEGORY_BY_SLUG) {
    if (rule.match.test(articleSlug)) return rule.categorySlug;
  }
  return fallbackSlug;
}

export async function seedCategoryTree(prisma: PrismaClient): Promise<Record<string, string>> {
  const categoryIds: Record<string, string> = {};

  for (const cat of ROOT_CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        status: 'PUBLISHED',
        parentId: null,
        deletedAt: null,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        status: 'PUBLISHED',
      },
    });
    categoryIds[cat.slug] = row.id;
  }

  for (const sub of SUBCATEGORIES) {
    const parentId = categoryIds[sub.parentSlug];
    if (!parentId) continue;
    const row = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {
        name: sub.name,
        description: sub.description ?? null,
        status: 'PUBLISHED',
        parentId,
        deletedAt: null,
      },
      create: {
        name: sub.name,
        slug: sub.slug,
        description: sub.description ?? null,
        status: 'PUBLISHED',
        parent: { connect: { id: parentId } },
      },
    });
    categoryIds[sub.slug] = row.id;
  }

  return categoryIds;
}

export async function reassignArticleCategories(prisma: PrismaClient, categoryIds: Record<string, string>) {
  const articles = await prisma.article.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, category: { select: { slug: true } } },
  });

  for (const article of articles) {
    const currentParent = article.category?.slug ?? 'finance';
    const targetSlug = resolveArticleCategorySlug(article.slug, currentParent);
    const categoryId = categoryIds[targetSlug] ?? categoryIds[currentParent];
    if (!categoryId) continue;
    await prisma.article.update({
      where: { id: article.id },
      data: { categoryId },
    });
  }
}
