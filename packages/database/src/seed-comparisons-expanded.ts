import type { PrismaClient } from '@prisma/client';

type AttrSeed = {
  key: string;
  label: string;
  valueType: string;
  groupKey: string;
  values: unknown[];
};

type ItemSeed = {
  productSlug: string;
  productName: string;
  productCategory: string;
  entityType: string;
  entityId: string;
  label: string;
};

async function upsertProduct(prisma: PrismaClient, slug: string, name: string, category: string) {
  return prisma.product.upsert({
    where: { slug },
    update: { name, category },
    create: { name, slug, category, description: `Comparison product for ${name}` },
  });
}

async function seedComparison(
  prisma: PrismaClient,
  opts: {
    slug: string;
    title: string;
    description: string;
    comparisonType: string;
    entityType: string;
    templateId: string;
    winnerEntityType?: string;
    winnerEntityId?: string;
    items: ItemSeed[];
    attrs: AttrSeed[];
    highlights?: Array<{ itemIndex: number; attrKey: string; highlight: string }>;
  },
) {
  const comparison = await prisma.comparison.upsert({
    where: { slug: opts.slug },
    update: {
      title: opts.title,
      description: opts.description,
      comparisonType: opts.comparisonType,
      entityType: opts.entityType,
      templateId: opts.templateId,
      winnerEntityType: opts.winnerEntityType ?? null,
      winnerEntityId: opts.winnerEntityId ?? null,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      title: opts.title,
      slug: opts.slug,
      description: opts.description,
      comparisonType: opts.comparisonType,
      entityType: opts.entityType,
      templateId: opts.templateId,
      winnerEntityType: opts.winnerEntityType ?? null,
      winnerEntityId: opts.winnerEntityId ?? null,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      viewCount: 12,
    },
  });

  await prisma.comparisonItem.deleteMany({ where: { comparisonId: comparison.id } });
  await prisma.comparisonAttribute.deleteMany({ where: { comparisonId: comparison.id } });

  const itemRows = [];
  for (const [index, item] of opts.items.entries()) {
    const product = await upsertProduct(prisma, item.productSlug, item.productName, item.productCategory);
    const row = await prisma.comparisonItem.create({
      data: {
        comparisonId: comparison.id,
        productId: product.id,
        entityType: item.entityType,
        entityId: item.entityId,
        label: item.label,
        sortOrder: index,
      },
    });
    itemRows.push(row);
  }

  const attrRows = [];
  for (const [index, attr] of opts.attrs.entries()) {
    const row = await prisma.comparisonAttribute.create({
      data: {
        comparisonId: comparison.id,
        key: attr.key,
        label: attr.label,
        valueType: attr.valueType,
        groupKey: attr.groupKey,
        values: attr.values as never,
        sortOrder: index,
      },
    });
    attrRows.push(row);
  }

  const highlightMap = new Map(
    (opts.highlights ?? []).map((h) => [`${h.itemIndex}:${h.attrKey}`, h.highlight]),
  );

  for (const [itemIndex, itemRow] of itemRows.entries()) {
    for (const attr of attrRows) {
      const attrSeed = opts.attrs.find((a) => a.key === attr.key);
      const value = attrSeed?.values[itemIndex];
      if (value === undefined) continue;
      await prisma.comparisonValue.create({
        data: {
          comparisonItemId: itemRow.id,
          comparisonAttributeId: attr.id,
          value: value as never,
          highlight: highlightMap.get(`${itemIndex}:${attr.key}`) ?? null,
        },
      });
    }
  }
}

export async function seedExpandedComparisons(prisma: PrismaClient) {
  const loanTemplate = await prisma.comparisonTemplate.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' },
    update: {
      name: 'Loan comparison',
      entityType: 'loan',
      description: 'Compare interest rate, fees, and tenure across loan products',
      attributes: [
        { key: 'rate', label: 'Interest rate', valueType: 'percentage', sortOrder: 0 },
        { key: 'fee', label: 'Processing fee', valueType: 'text', sortOrder: 1 },
        { key: 'tenure', label: 'Max tenure', valueType: 'text', sortOrder: 2 },
        { key: 'maxAmount', label: 'Max amount', valueType: 'currency', sortOrder: 3 },
      ],
    },
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      name: 'Loan comparison',
      entityType: 'loan',
      description: 'Compare interest rate, fees, and tenure across loan products',
      attributes: [
        { key: 'rate', label: 'Interest rate', valueType: 'percentage', sortOrder: 0 },
        { key: 'fee', label: 'Processing fee', valueType: 'text', sortOrder: 1 },
        { key: 'tenure', label: 'Max tenure', valueType: 'text', sortOrder: 2 },
        { key: 'maxAmount', label: 'Max amount', valueType: 'currency', sortOrder: 3 },
      ],
    },
  });

  const bankTemplate = await prisma.comparisonTemplate.upsert({
    where: { id: '00000000-0000-4000-8000-000000000202' },
    update: {
      name: 'Bank comparison',
      entityType: 'bank',
      description: 'Retail banking footprint and digital experience',
      attributes: [
        { key: 'branches', label: 'Branch network', valueType: 'text', sortOrder: 0 },
        { key: 'digital', label: 'Digital banking', valueType: 'rating', sortOrder: 1 },
        { key: 'support', label: 'Customer support', valueType: 'rating', sortOrder: 2 },
      ],
    },
    create: {
      id: '00000000-0000-4000-8000-000000000202',
      name: 'Bank comparison',
      entityType: 'bank',
      description: 'Retail banking footprint and digital experience',
      attributes: [
        { key: 'branches', label: 'Branch network', valueType: 'text', sortOrder: 0 },
        { key: 'digital', label: 'Digital banking', valueType: 'rating', sortOrder: 1 },
        { key: 'support', label: 'Customer support', valueType: 'rating', sortOrder: 2 },
      ],
    },
  });

  const insuranceTemplate = await prisma.comparisonTemplate.upsert({
    where: { id: '00000000-0000-4000-8000-000000000203' },
    update: {
      name: 'Insurance comparison',
      entityType: 'insurance',
      description: 'Coverage, premium, and benefits',
      attributes: [
        { key: 'premium', label: 'Indicative premium', valueType: 'currency', sortOrder: 0 },
        { key: 'coverage', label: 'Coverage', valueType: 'text', sortOrder: 1 },
        { key: 'claims', label: 'Claims experience', valueType: 'rating', sortOrder: 2 },
      ],
    },
    create: {
      id: '00000000-0000-4000-8000-000000000203',
      name: 'Insurance comparison',
      entityType: 'insurance',
      description: 'Coverage, premium, and benefits',
      attributes: [
        { key: 'premium', label: 'Indicative premium', valueType: 'currency', sortOrder: 0 },
        { key: 'coverage', label: 'Coverage', valueType: 'text', sortOrder: 1 },
        { key: 'claims', label: 'Claims experience', valueType: 'rating', sortOrder: 2 },
      ],
    },
  });

  const materialTemplate = await prisma.comparisonTemplate.upsert({
    where: { id: '00000000-0000-4000-8000-000000000204' },
    update: {
      name: 'Construction material comparison',
      entityType: 'construction_material',
      description: 'Unit cost and typical use cases',
      attributes: [
        { key: 'unitCost', label: 'Unit cost', valueType: 'currency', sortOrder: 0 },
        { key: 'unit', label: 'Unit', valueType: 'text', sortOrder: 1 },
        { key: 'useCase', label: 'Best for', valueType: 'text', sortOrder: 2 },
      ],
    },
    create: {
      id: '00000000-0000-4000-8000-000000000204',
      name: 'Construction material comparison',
      entityType: 'construction_material',
      description: 'Unit cost and typical use cases',
      attributes: [
        { key: 'unitCost', label: 'Unit cost', valueType: 'currency', sortOrder: 0 },
        { key: 'unit', label: 'Unit', valueType: 'text', sortOrder: 1 },
        { key: 'useCase', label: 'Best for', valueType: 'text', sortOrder: 2 },
      ],
    },
  });

  const hdfc = await prisma.bank.findUnique({ where: { slug: 'hdfc-bank' } });
  const sbi = await prisma.bank.findUnique({ where: { slug: 'sbi' } });
  const hdfcPersonal = hdfc
    ? await prisma.loan.findFirst({ where: { bankId: hdfc.id, slug: 'personal-loan', deletedAt: null } })
    : null;
  const sbiHome = sbi
    ? await prisma.loan.findFirst({ where: { bankId: sbi.id, slug: 'home-loan', deletedAt: null } })
    : null;
  const motorInsurance = await prisma.insuranceProduct.findUnique({ where: { slug: 'motor-comprehensive' } });
  const termInsurance = await prisma.insuranceProduct.findUnique({ where: { slug: 'term-life-basic' } });
  const opcCement = await prisma.constructionMaterial.findUnique({ where: { slug: 'opc-53-cement' } });
  const tmtSteel = await prisma.constructionMaterial.findUnique({ where: { slug: 'tmt-fe500d' } });
  const premiumPaint = await prisma.constructionMaterial.findUnique({ where: { slug: 'premium-emulsion-paint' } });

  const materialsCat = await prisma.constructionCategory.findFirst({ where: { slug: 'materials' } });
  const asianPaints = await prisma.constructionBrand.findUnique({ where: { slug: 'asian-paints' } });
  const economyPaint =
    premiumPaint && materialsCat
      ? await prisma.constructionMaterial.upsert({
          where: { slug: 'economy-interior-paint' },
          update: {
            name: 'Economy Interior Paint',
            unit: 'litre',
            unitCost: 180,
            approximatePrice: 180,
            categoryId: materialsCat.id,
            brandId: asianPaints?.id ?? null,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
          create: {
            name: 'Economy Interior Paint',
            slug: 'economy-interior-paint',
            unit: 'litre',
            unitCost: 180,
            approximatePrice: 180,
            description: 'Budget interior emulsion for rental refreshes.',
            categoryId: materialsCat.id,
            brandId: asianPaints?.id ?? null,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        })
      : null;

  if (hdfcPersonal && sbiHome) {
    await seedComparison(prisma, {
      slug: 'hdfc-personal-loan-vs-sbi-home-loan',
      title: 'HDFC Personal Loan vs SBI Home Loan',
      description: 'Unsecured personal borrowing vs long-tenure secured home finance.',
      comparisonType: 'loan',
      entityType: 'loan',
      templateId: loanTemplate.id,
      winnerEntityType: 'loan',
      winnerEntityId: sbiHome.id,
      items: [
        {
          productSlug: 'hdfc-personal-loan-product',
          productName: 'HDFC Personal Loan',
          productCategory: 'finance',
          entityType: 'loan',
          entityId: hdfcPersonal.id,
          label: 'HDFC Personal Loan',
        },
        {
          productSlug: 'sbi-home-loan-product',
          productName: 'SBI Home Loan',
          productCategory: 'finance',
          entityType: 'loan',
          entityId: sbiHome.id,
          label: 'SBI Home Loan',
        },
      ],
      attrs: [
        { key: 'rate', label: 'Interest rate', valueType: 'percentage', groupKey: 'pricing', values: ['10.5% p.a.', '8.5% p.a.'] },
        { key: 'fee', label: 'Processing fee', valueType: 'text', groupKey: 'pricing', values: ['1.5%', '0.35%'] },
        { key: 'tenure', label: 'Max tenure', valueType: 'text', groupKey: 'terms', values: ['60 months', '360 months'] },
        { key: 'maxAmount', label: 'Max amount', valueType: 'currency', groupKey: 'terms', values: ['₹40L', '₹10Cr'] },
      ],
      highlights: [
        { itemIndex: 1, attrKey: 'rate', highlight: 'best_value' },
        { itemIndex: 0, attrKey: 'fee', highlight: 'best_budget' },
      ],
    });
  }

  if (hdfc && sbi) {
    await seedComparison(prisma, {
      slug: 'hdfc-bank-vs-sbi',
      title: 'HDFC Bank vs State Bank of India',
      description: 'Private-sector digital experience vs public-sector reach.',
      comparisonType: 'bank',
      entityType: 'bank',
      templateId: bankTemplate.id,
      winnerEntityType: 'bank',
      winnerEntityId: hdfc.id,
      items: [
        {
          productSlug: 'hdfc-bank-product',
          productName: 'HDFC Bank',
          productCategory: 'finance',
          entityType: 'bank',
          entityId: hdfc.id,
          label: 'HDFC Bank',
        },
        {
          productSlug: 'sbi-bank-product',
          productName: 'State Bank of India',
          productCategory: 'finance',
          entityType: 'bank',
          entityId: sbi.id,
          label: 'State Bank of India',
        },
      ],
      attrs: [
        { key: 'branches', label: 'Branch network', valueType: 'text', groupKey: 'reach', values: ['7,800+', '22,000+'] },
        { key: 'digital', label: 'Digital banking', valueType: 'rating', groupKey: 'experience', values: [4.5, 3.8] },
        { key: 'support', label: 'Customer support', valueType: 'rating', groupKey: 'experience', values: [4.2, 4.0] },
      ],
      highlights: [{ itemIndex: 0, attrKey: 'digital', highlight: 'best_overall' }],
    });
  }

  if (motorInsurance && termInsurance) {
    await seedComparison(prisma, {
      slug: 'motor-vs-term-life-insurance',
      title: 'Motor Comprehensive vs Term Life Basic',
      description: 'Asset protection for your car vs income protection for your family.',
      comparisonType: 'insurance',
      entityType: 'insurance',
      templateId: insuranceTemplate.id,
      items: [
        {
          productSlug: 'motor-comprehensive-product',
          productName: 'Motor Comprehensive',
          productCategory: 'finance',
          entityType: 'insurance',
          entityId: motorInsurance.id,
          label: 'Motor Comprehensive',
        },
        {
          productSlug: 'term-life-basic-product',
          productName: 'Term Life Basic',
          productCategory: 'finance',
          entityType: 'insurance',
          entityId: termInsurance.id,
          label: 'Term Life Basic',
        },
      ],
      attrs: [
        { key: 'premium', label: 'Indicative premium', valueType: 'currency', groupKey: 'pricing', values: ['₹8,999/yr', '₹499/mo'] },
        {
          key: 'coverage',
          label: 'Coverage',
          valueType: 'text',
          groupKey: 'coverage',
          values: ['Own damage + third party', 'Life cover up to ₹1 Cr'],
        },
        { key: 'claims', label: 'Claims experience', valueType: 'rating', groupKey: 'service', values: [4.1, 4.3] },
      ],
    });
  }

  if (opcCement && tmtSteel) {
    await seedComparison(prisma, {
      slug: 'opc-cement-vs-tmt-steel',
      title: 'OPC 53 Cement vs TMT Fe500D Steel',
      description: 'Structural materials compared by unit economics and typical application.',
      comparisonType: 'cement',
      entityType: 'construction_material',
      templateId: materialTemplate.id,
      items: [
        {
          productSlug: 'opc-53-cement-product',
          productName: 'OPC 53 Grade Cement',
          productCategory: 'construction',
          entityType: 'construction_material',
          entityId: opcCement.id,
          label: 'OPC 53 Cement',
        },
        {
          productSlug: 'tmt-fe500d-product',
          productName: 'TMT Fe500D Bars',
          productCategory: 'construction',
          entityType: 'construction_material',
          entityId: tmtSteel.id,
          label: 'TMT Fe500D',
        },
      ],
      attrs: [
        { key: 'unitCost', label: 'Unit cost', valueType: 'currency', groupKey: 'pricing', values: ['₹380/bag', '₹68/kg'] },
        { key: 'unit', label: 'Unit', valueType: 'text', groupKey: 'specs', values: ['bag', 'kg'] },
        {
          key: 'useCase',
          label: 'Best for',
          valueType: 'text',
          groupKey: 'specs',
          values: ['Masonry & plaster', 'RCC structural frames'],
        },
      ],
    });
  }

  if (premiumPaint && economyPaint) {
    await seedComparison(prisma, {
      slug: 'premium-vs-economy-interior-paint',
      title: 'Premium vs Economy Interior Paint',
      description: 'Finish quality and durability for premium homes vs quick rental refreshes.',
      comparisonType: 'paint',
      entityType: 'construction_material',
      templateId: materialTemplate.id,
      winnerEntityType: 'construction_material',
      winnerEntityId: premiumPaint.id,
      items: [
        {
          productSlug: 'premium-emulsion-paint-product',
          productName: 'Premium Emulsion Paint',
          productCategory: 'construction',
          entityType: 'construction_material',
          entityId: premiumPaint.id,
          label: 'Premium Emulsion',
        },
        {
          productSlug: 'economy-interior-paint-product',
          productName: 'Economy Interior Paint',
          productCategory: 'construction',
          entityType: 'construction_material',
          entityId: economyPaint.id,
          label: 'Economy Interior',
        },
      ],
      attrs: [
        { key: 'unitCost', label: 'Unit cost', valueType: 'currency', groupKey: 'pricing', values: ['₹320/L', '₹180/L'] },
        { key: 'unit', label: 'Unit', valueType: 'text', groupKey: 'specs', values: ['litre', 'litre'] },
        {
          key: 'useCase',
          label: 'Best for',
          valueType: 'text',
          groupKey: 'specs',
          values: ['Premium interiors', 'Rental / budget refresh'],
        },
      ],
      highlights: [{ itemIndex: 0, attrKey: 'useCase', highlight: 'best_premium' }],
    });
  }
}
