import type { PrismaClient } from '@prisma/client';

const WIDGET_CATALOG = [
  {
    slug: 'hero',
    name: 'Hero banner',
    description: 'Full-width hero. Set variant=classic for the marketing homepage design.',
    schema: {
      type: 'object',
      properties: {
        variant: { type: 'string', enum: ['classic', 'default'] },
      },
    },
  },
  {
    slug: 'articles',
    name: 'Articles',
    description: 'Article grid from latest, featured, or a category.',
    schema: {
      type: 'object',
      properties: {
        variant: { type: 'string', enum: ['classic', 'default'] },
        source: { type: 'string', enum: ['latest', 'featured', 'category'] },
        categoryId: { type: 'string' },
        limit: { type: 'number', default: 5 },
      },
    },
  },
  {
    slug: 'calculators',
    name: 'Calculators',
    description: 'Calculator cards grid. Set variant=classic for the icon tile grid.',
    schema: {
      type: 'object',
      properties: {
        variant: { type: 'string', enum: ['classic', 'default'] },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    slug: 'categories',
    name: 'Category explorer',
    description: 'Explore by category cards (classic marketing layout).',
    schema: { type: 'object', properties: {} },
  },
  {
    slug: 'ai-tools',
    name: 'AI tools grid',
    description: 'Smart AI tools icon grid (classic marketing layout).',
    schema: { type: 'object', properties: {} },
  },
  {
    slug: 'homepage-columns',
    name: 'Compare, reviews & directory',
    description: 'Three-column row: comparisons, reviews, and professionals.',
    schema: {
      type: 'object',
      properties: {
        comparisonLimit: { type: 'number', default: 2 },
        reviewLimit: { type: 'number', default: 4 },
      },
    },
  },
  {
    slug: 'trust-newsletter',
    name: 'Trust strip & newsletter',
    description: 'Trust badges and newsletter signup (classic marketing layout).',
    schema: { type: 'object', properties: {} },
  },
  {
    slug: 'reviews',
    name: 'Reviews',
    description: 'Product and service reviews grid.',
    schema: { type: 'object', properties: { limit: { type: 'number', default: 6 } } },
  },
  {
    slug: 'directory',
    name: 'Business directory',
    description: 'Featured businesses from the directory.',
    schema: { type: 'object', properties: {} },
  },
  {
    slug: 'trending',
    name: 'Trending searches',
    description: 'Popular search keywords from the last 7 days.',
    schema: {
      type: 'object',
      properties: { limit: { type: 'number', default: 8 } },
    },
  },
  {
    slug: 'newsletter',
    name: 'Newsletter signup',
    description: 'Email capture form for the newsletter.',
    schema: { type: 'object', properties: {} },
  },
] as const;

/** Classic marketing homepage — matches the original static design. */
const CLASSIC_DEFAULT_SECTIONS = [
  {
    name: 'Hero',
    widgetSlug: 'hero',
    sortOrder: 0,
    settings: { variant: 'classic' },
  },
  {
    name: 'Popular Calculators & Tools',
    widgetSlug: 'calculators',
    sortOrder: 1,
    settings: { variant: 'classic', limit: 10 },
  },
  {
    name: 'Explore by Category',
    widgetSlug: 'categories',
    sortOrder: 2,
  },
  {
    name: 'Trending Articles',
    widgetSlug: 'articles',
    sortOrder: 3,
    settings: { variant: 'classic', source: 'latest', limit: 5 },
  },
  {
    name: 'Smart AI Tools',
    widgetSlug: 'ai-tools',
    sortOrder: 4,
  },
  {
    name: 'Compare, reviews & directory',
    widgetSlug: 'homepage-columns',
    sortOrder: 5,
    settings: { comparisonLimit: 2, reviewLimit: 4 },
  },
  {
    name: 'Trust & newsletter',
    widgetSlug: 'trust-newsletter',
    sortOrder: 6,
  },
] as const;

async function replaceLayoutSections(
  prisma: PrismaClient,
  layoutId: string,
  widgetsBySlug: Map<string, { id: string }>,
  sections: typeof CLASSIC_DEFAULT_SECTIONS,
) {
  const now = new Date();
  const existingSections = await prisma.homepageSection.findMany({
    where: { layoutId, deletedAt: null },
    select: { id: true },
  });

  if (existingSections.length) {
    await prisma.widgetInstance.updateMany({
      where: { sectionId: { in: existingSections.map((s) => s.id) }, deletedAt: null },
      data: { deletedAt: now },
    });
    await prisma.homepageSection.updateMany({
      where: { id: { in: existingSections.map((s) => s.id) } },
      data: { deletedAt: now },
    });
  }

  for (const section of sections) {
    const widget = widgetsBySlug.get(section.widgetSlug);
    if (!widget) continue;

    const sectionRow = await prisma.homepageSection.create({
      data: {
        layoutId,
        name: section.name,
        sortOrder: section.sortOrder,
      },
    });

    await prisma.widgetInstance.create({
      data: {
        sectionId: sectionRow.id,
        widgetId: widget.id,
        sortOrder: 0,
        settings: 'settings' in section ? section.settings : undefined,
      },
    });
  }
}

export async function seedHomepage(prisma: PrismaClient) {
  const widgetsBySlug = new Map<string, { id: string }>();

  for (const widget of WIDGET_CATALOG) {
    const row = await prisma.widget.upsert({
      where: { slug: widget.slug },
      update: {
        name: widget.name,
        description: widget.description,
        schema: widget.schema,
        deletedAt: null,
      },
      create: {
        slug: widget.slug,
        name: widget.name,
        description: widget.description,
        schema: widget.schema,
      },
    });
    widgetsBySlug.set(widget.slug, row);
  }

  const existing = await prisma.homepageLayout.findFirst({
    where: { slug: 'default', deletedAt: null },
  });

  const layout =
    existing ??
    (await prisma.homepageLayout.create({
      data: {
        name: 'Default homepage',
        slug: 'default',
        isDefault: true,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    }));

  await prisma.homepageLayout.updateMany({
    where: { isDefault: true, deletedAt: null, NOT: { id: layout.id } },
    data: { isDefault: false },
  });

  await prisma.homepageLayout.update({
    where: { id: layout.id },
    data: {
      isDefault: true,
      status: 'PUBLISHED',
      publishedAt: layout.publishedAt ?? new Date(),
    },
  });

  await replaceLayoutSections(prisma, layout.id, widgetsBySlug, CLASSIC_DEFAULT_SECTIONS);
}
