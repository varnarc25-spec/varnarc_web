import type { PrismaClient } from '@prisma/client';

const LOAN_TYPE_LABELS: Record<string, string> = {
  home: 'Home',
  personal: 'Personal',
  car: 'Car',
  education: 'Education',
};

const CALCULATOR_ARTICLE_MAP: Record<
  string,
  { categorySlug: string; loanTypes?: string[]; titlePrefix?: string }
> = {
  loan: { categorySlug: 'home-loans', loanTypes: ['home', 'personal', 'car', 'education'] },
  emi: { categorySlug: 'home-loans' },
  'car-loan': { categorySlug: 'car-loans' },
  'income-tax': { categorySlug: 'tax-planning' },
  gst: { categorySlug: 'tax-planning' },
  sip: { categorySlug: 'investments' },
  retirement: { categorySlug: 'investments' },
  paint: { categorySlug: 'home-construction' },
  'construction-cost': { categorySlug: 'home-construction' },
  solar: { categorySlug: 'solar-energy' },
  tile: { categorySlug: 'home-construction' },
  flooring: { categorySlug: 'home-construction' },
};

function articleBody(calculatorName: string, categoryLabel: string, loanType?: string): string {
  const loanLine = loanType
    ? `This guide focuses on **${LOAN_TYPE_LABELS[loanType] ?? loanType} loans** — rates, tenure, and repayment tips specific to that product.`
    : '';
  return `## Overview

Use the **${calculatorName}** on Varnarc to model numbers before you commit. ${loanLine}

## What you will learn

- Which inputs matter most for accurate results
- How to compare scenarios (tenure, rate, amount)
- Common mistakes borrowers make in India
- When to verify figures with your bank or advisor

## Using the calculator

Enter your values step by step, then review EMI, total interest, and repayment summary. Adjust tenure or rate to see how small changes affect your monthly budget.

## Bottom line

Treat calculator output as a planning estimate. Confirm final numbers with official lender quotes and read the fine print on fees and insurance.`;
}

export async function seedCalculatorArticles(prisma: PrismaClient, authorId: string) {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  });
  const categoryIds = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const calculators = await prisma.calculator.findMany({
    where: { deletedAt: null, status: 'PUBLISHED' },
    select: { id: true, slug: true, name: true, settings: true },
    orderBy: { name: 'asc' },
  });

  for (const calc of calculators) {
    const mapping = CALCULATOR_ARTICLE_MAP[calc.slug] ?? {
      categorySlug: 'calculator-guides',
      titlePrefix: 'Guide',
    };
    const categoryId = categoryIds[mapping.categorySlug] ?? categoryIds['calculator-guides'];
    if (!categoryId) continue;

    const loanTypes = mapping.loanTypes ?? [undefined];
    for (const loanType of loanTypes) {
      const slugSuffix = loanType ? `-${loanType}` : '';
      const slug = `guide-${calc.slug}${slugSuffix}`;
      const loanLabel = loanType ? `${LOAN_TYPE_LABELS[loanType] ?? loanType} ` : '';
      const title = `${loanLabel}${calc.name}: Complete Guide`;
      const excerpt = `Learn how to use the ${calc.name}${loanType ? ` for ${loanLabel.trim().toLowerCase()} loans` : ''} and what the results mean for your finances.`;
      const content = articleBody(calc.name, mapping.categorySlug, loanType);
      const readingTime = Math.max(3, Math.ceil(content.split(/\s+/).length / 200));
      const metadata: Record<string, unknown> = {
        calculatorSlugs: [calc.slug],
        ...(loanType ? { loanTypes: [loanType] } : {}),
      };

      await prisma.article.upsert({
        where: { slug },
        update: {
          title,
          excerpt,
          content,
          categoryId,
          authorId,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          readingTimeMinutes: readingTime,
          metadata: metadata as never,
          deletedAt: null,
        },
        create: {
          title,
          slug,
          excerpt,
          content,
          categoryId,
          authorId,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          readingTimeMinutes: readingTime,
          metadata: metadata as never,
        },
      });
    }

    const relatedArticles = {
      categorySlug: mapping.categorySlug,
      ...(calc.slug === 'loan'
        ? {
            topicField: 'loanType',
            topicCategorySlugs: {
              home: 'home-loans',
              personal: 'personal-loans',
              car: 'car-loans',
              education: 'education-loans',
            },
          }
        : {}),
    };

    const settings =
      calc.settings && typeof calc.settings === 'object'
        ? { ...(calc.settings as Record<string, unknown>), relatedArticles }
        : { relatedArticles };

    await prisma.calculator.update({
      where: { id: calc.id },
      data: { settings: settings as never },
    });
  }
}
