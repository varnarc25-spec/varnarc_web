import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  INDIA_STATES,
  INDIA_UTS,
  LABOUR_TRADES,
  MAJOR_CITIES,
  PHASE_TEMPLATES,
  QUALITY_TIERS,
  QUALITY_SPECIFICATIONS,
  RATE_SOURCE_REGISTRY,
  WASTAGE_RULES,
  NATIONAL_BASE_RATE_PER_SQFT,
  DEFAULT_COMMERCIAL_RULES,
  WORK_ITEM_PLANNING_RESOURCES,
  PRODUCTIVITY_NORMS,
} from '@varnarc/validation';

const EQUIPMENT = [
  'jcb',
  'excavator',
  'concrete-mixer',
  'concrete-pump',
  'needle-vibrator',
  'plate-compactor',
  'tower-crane',
  'mobile-crane',
  'construction-hoist',
  'scaffolding',
  'generator',
  'core-cutting-machine',
  'tile-cutting-machine',
  'truck',
  'tipper',
  'water-tanker',
];

const PROFESSIONALS = [
  { slug: 'architect', name: 'Architect' },
  { slug: 'structural-engineer', name: 'Structural Engineer' },
  { slug: 'mep-consultant', name: 'MEP Consultant' },
  { slug: 'interior-designer', name: 'Interior Designer' },
  { slug: 'landscape-architect', name: 'Landscape Architect' },
  { slug: 'surveyor', name: 'Surveyor' },
  { slug: 'soil-testing', name: 'Soil Testing' },
  { slug: 'quantity-surveyor', name: 'Quantity Surveyor' },
  { slug: 'pmc', name: 'Project Management Consultant' },
  { slug: 'site-supervisor', name: 'Site Supervisor' },
  { slug: 'approval-consultant', name: 'Approval Consultant' },
];

const WORK_ITEMS = [
  { code: 'SITE_CLEARING', name: 'Site clearing', phase: 'SITE_PREPARATION', unit: 'sqm' },
  { code: 'EARTH_EXCAVATION', name: 'Earth excavation', phase: 'FOUNDATION', unit: 'cum' },
  { code: 'PCC', name: 'PCC', phase: 'FOUNDATION', unit: 'cum' },
  { code: 'RCC_FOOTING', name: 'RCC footing', phase: 'FOUNDATION', unit: 'cum' },
  { code: 'RCC_COLUMN', name: 'RCC column', phase: 'RCC_STRUCTURE', unit: 'cum' },
  { code: 'RCC_BEAM', name: 'RCC beam', phase: 'RCC_STRUCTURE', unit: 'cum' },
  { code: 'RCC_SLAB', name: 'RCC slab', phase: 'RCC_STRUCTURE', unit: 'cum' },
  { code: 'REINFORCEMENT', name: 'Reinforcement', phase: 'RCC_STRUCTURE', unit: 'kg' },
  { code: 'FORMWORK', name: 'Formwork', phase: 'RCC_STRUCTURE', unit: 'sqm' },
  { code: 'BRICK_MASONRY', name: 'Brick masonry', phase: 'MASONRY', unit: 'cum' },
  { code: 'AAC_MASONRY', name: 'AAC masonry', phase: 'MASONRY', unit: 'cum' },
  { code: 'INTERNAL_PLASTER', name: 'Internal plaster', phase: 'PLASTERING', unit: 'sqm' },
  { code: 'EXTERNAL_PLASTER', name: 'External plaster', phase: 'PLASTERING', unit: 'sqm' },
  { code: 'WATERPROOFING', name: 'Waterproofing', phase: 'WATERPROOFING', unit: 'sqm' },
  { code: 'FLOORING', name: 'Flooring', phase: 'FLOORING', unit: 'sqm' },
  { code: 'INTERIOR_PAINTING', name: 'Interior painting', phase: 'PAINTING', unit: 'sqm' },
  {
    code: 'ELECTRICAL_POINT',
    name: 'Electrical point',
    phase: 'ELECTRICAL_ROUGH_IN',
    unit: 'point',
  },
  { code: 'PLUMBING_POINT', name: 'Plumbing point', phase: 'PLUMBING_ROUGH_IN', unit: 'point' },
  { code: 'FALSE_CEILING', name: 'False ceiling', phase: 'FALSE_CEILING', unit: 'sqm' },
  { code: 'RCC_STAIRCASE', name: 'RCC staircase', phase: 'RCC_STRUCTURE', unit: 'cum' },
  { code: 'CONCRETE_BLOCK_MASONRY', name: 'Concrete block masonry', phase: 'MASONRY', unit: 'cum' },
  { code: 'FLOOR_SCREED', name: 'Floor screed', phase: 'FLOORING', unit: 'sqm' },
  { code: 'WALL_TILE', name: 'Wall tile', phase: 'FLOORING', unit: 'sqm' },
  { code: 'PUTTY', name: 'Putty', phase: 'PAINTING', unit: 'sqm' },
  { code: 'PRIMER', name: 'Primer', phase: 'PAINTING', unit: 'sqm' },
  { code: 'EXTERIOR_PAINTING', name: 'Exterior painting', phase: 'PAINTING', unit: 'sqm' },
  { code: 'ELECTRICAL_DB', name: 'Electrical DB', phase: 'ELECTRICAL_ROUGH_IN', unit: 'item' },
  { code: 'EARTHING', name: 'Earthing', phase: 'ELECTRICAL_ROUGH_IN', unit: 'item' },
  { code: 'WATER_SUPPLY', name: 'Water supply', phase: 'PLUMBING_ROUGH_IN', unit: 'rmt' },
  { code: 'DRAINAGE', name: 'Drainage', phase: 'PLUMBING_ROUGH_IN', unit: 'rmt' },
  {
    code: 'SANITARY_INSTALL',
    name: 'Sanitary fixture installation',
    phase: 'SANITARY',
    unit: 'item',
  },
  { code: 'DOOR_INSTALL', name: 'Door installation', phase: 'DOORS', unit: 'item' },
  { code: 'WINDOW_INSTALL', name: 'Window installation', phase: 'WINDOWS', unit: 'item' },
  { code: 'KITCHEN', name: 'Kitchen', phase: 'KITCHEN', unit: 'job' },
  { code: 'WARDROBE', name: 'Wardrobe', phase: 'INTERIORS', unit: 'sqft' },
  { code: 'EXTERNAL_PAVING', name: 'External paving', phase: 'EXTERNAL_WORK', unit: 'sqm' },
  { code: 'COMPOUND_WALL', name: 'Compound wall', phase: 'EXTERNAL_WORK', unit: 'rmt' },
  { code: 'GATE', name: 'Gate', phase: 'EXTERNAL_WORK', unit: 'item' },
  { code: 'LANDSCAPE', name: 'Landscape', phase: 'LANDSCAPING', unit: 'sqm' },
  { code: 'HANDOVER', name: 'Handover', phase: 'HANDOVER', unit: 'job' },
  { code: 'CLEANING', name: 'Cleaning', phase: 'CLEANING', unit: 'job' },
];

const INTERIORS = [
  { slug: 'modular-kitchen', name: 'Modular kitchen', roomType: 'Kitchen', unit: 'rft' },
  { slug: 'wardrobe', name: 'Wardrobe', roomType: 'Bedroom', unit: 'sqft' },
  { slug: 'tv-unit', name: 'TV unit', roomType: 'Living Room', unit: 'rft' },
  { slug: 'false-ceiling', name: 'False ceiling', roomType: 'Living Room', unit: 'sqft' },
  { slug: 'bed', name: 'Bed', roomType: 'Bedroom', unit: 'item' },
  { slug: 'headboard', name: 'Headboard', roomType: 'Bedroom', unit: 'item' },
  { slug: 'study-unit', name: 'Study unit', roomType: 'Study', unit: 'rft' },
  { slug: 'pooja-unit', name: 'Pooja unit', roomType: 'Pooja Room', unit: 'item' },
  { slug: 'partition', name: 'Partition', roomType: 'Living Room', unit: 'sqft' },
  { slug: 'curtain', name: 'Curtain', roomType: 'Living Room', unit: 'rft' },
];

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function seedConstructionIntelligence(prisma: PrismaClient) {
  const india = await prisma.constructionLocation.upsert({
    where: { slug: 'india' },
    update: { name: 'India', type: 'COUNTRY', deletedAt: null },
    create: { id: randomUUID(), slug: 'india', name: 'India', type: 'COUNTRY' },
  });

  const stateIds = new Map<string, string>();
  for (const row of [...INDIA_STATES, ...INDIA_UTS]) {
    const loc = await prisma.constructionLocation.upsert({
      where: { slug: row.slug },
      update: { name: row.name, type: 'STATE', parentId: india.id, deletedAt: null },
      create: {
        id: randomUUID(),
        slug: row.slug,
        name: row.name,
        type: 'STATE',
        parentId: india.id,
      },
    });
    stateIds.set(row.slug, loc.id);
  }

  for (const city of MAJOR_CITIES) {
    const parentId = stateIds.get(city.stateSlug) ?? india.id;
    const loc = await prisma.constructionLocation.upsert({
      where: { slug: city.slug },
      update: { name: city.name, type: 'CITY', parentId, deletedAt: null },
      create: {
        id: randomUUID(),
        slug: city.slug,
        name: city.name,
        type: 'CITY',
        parentId,
      },
    });
    await prisma.constructionLocationCostFactor.upsert({
      where: { locationId: loc.id },
      update: {
        materialTransportFactor: 1,
        labourFactor: 1,
        equipmentFactor: 1,
        interiorFactor: 1,
        logisticsFactor: 1,
        sourceType: 'ESTIMATED_FALLBACK',
        notes: 'Default 1.0 until researched city factors are loaded. Not a metro premium.',
      },
      create: {
        id: randomUUID(),
        locationId: loc.id,
        materialTransportFactor: 1,
        labourFactor: 1,
        equipmentFactor: 1,
        interiorFactor: 1,
        logisticsFactor: 1,
        sourceType: 'ESTIMATED_FALLBACK',
        notes: 'Default 1.0 until researched city factors are loaded. Not a metro premium.',
      },
    });
  }

  await prisma.constructionLocationCostFactor.upsert({
    where: { locationId: india.id },
    update: {
      materialTransportFactor: 1,
      labourFactor: 1,
      equipmentFactor: 1,
      interiorFactor: 1,
      logisticsFactor: 1,
      sourceType: 'ESTIMATED_FALLBACK',
      notes: 'National default 1.0.',
    },
    create: {
      id: randomUUID(),
      locationId: india.id,
      materialTransportFactor: 1,
      labourFactor: 1,
      equipmentFactor: 1,
      interiorFactor: 1,
      logisticsFactor: 1,
      sourceType: 'ESTIMATED_FALLBACK',
      notes: 'National default 1.0.',
    },
  });

  for (const source of RATE_SOURCE_REGISTRY) {
    const existing = await prisma.constructionRateSource.findFirst({
      where: { name: source.name, deletedAt: null },
    });
    const payload = {
      organization: source.organization,
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
      geographicalCoverage: source.coverage,
      notes: source.notes,
      locationId: india.id,
      lastCheckedAt: new Date(),
    };
    if (existing) {
      await prisma.constructionRateSource.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.constructionRateSource.create({
        data: { id: randomUUID(), name: source.name, ...payload },
      });
    }
  }

  for (const trade of LABOUR_TRADES) {
    await prisma.constructionLabourTrade.upsert({
      where: { slug: trade },
      update: { name: titleFromSlug(trade), deletedAt: null },
      create: { id: randomUUID(), slug: trade, name: titleFromSlug(trade), defaultUnit: 'perDay' },
    });
  }

  for (const slug of EQUIPMENT) {
    await prisma.constructionEquipment.upsert({
      where: { slug },
      update: { name: titleFromSlug(slug), deletedAt: null },
      create: { id: randomUUID(), slug, name: titleFromSlug(slug), defaultUnit: 'day' },
    });
  }

  for (const service of PROFESSIONALS) {
    await prisma.constructionProfessionalService.upsert({
      where: { slug: service.slug },
      update: { name: service.name, deletedAt: null },
      create: { id: randomUUID(), slug: service.slug, name: service.name },
    });
  }

  const phaseIds = new Map<string, string>();
  for (const phase of PHASE_TEMPLATES) {
    const row = await prisma.constructionPhaseTemplate.upsert({
      where: { code: phase.code },
      update: { name: phase.name, sortOrder: phase.sortOrder, deletedAt: null },
      create: {
        id: randomUUID(),
        code: phase.code,
        name: phase.name,
        sortOrder: phase.sortOrder,
      },
    });
    phaseIds.set(phase.code, row.id);
  }

  for (const item of WORK_ITEMS) {
    await prisma.constructionWorkItem.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        unit: item.unit,
        phaseId: phaseIds.get(item.phase) ?? null,
        deletedAt: null,
      },
      create: {
        id: randomUUID(),
        code: item.code,
        name: item.name,
        unit: item.unit,
        phaseId: phaseIds.get(item.phase) ?? null,
      },
    });
  }

  for (const res of WORK_ITEM_PLANNING_RESOURCES) {
    const workItem = await prisma.constructionWorkItem.findUnique({
      where: { code: res.workItemCode },
    });
    if (!workItem) continue;
    await prisma.constructionWorkItemResource.upsert({
      where: {
        workItemId_resourceType_resourceKey: {
          workItemId: workItem.id,
          resourceType: res.resourceType,
          resourceKey: res.resourceKey,
        },
      },
      update: {
        quantityCoefficient: res.quantityCoefficient,
        wastagePercent: res.wastagePercent,
        unit: res.unit,
        sourceType: 'ESTIMATED_FALLBACK',
        confidence: 'LOW',
        deletedAt: null,
      },
      create: {
        id: randomUUID(),
        workItemId: workItem.id,
        resourceType: res.resourceType,
        resourceKey: res.resourceKey,
        quantityCoefficient: res.quantityCoefficient,
        wastagePercent: res.wastagePercent,
        unit: res.unit,
        sourceType: 'ESTIMATED_FALLBACK',
        confidence: 'LOW',
      },
    });
  }

  for (const norm of PRODUCTIVITY_NORMS) {
    const trade = await prisma.constructionLabourTrade.findUnique({
      where: { slug: norm.tradeSlug },
    });
    const workItem = await prisma.constructionWorkItem.findUnique({
      where: { code: norm.workItemCode },
    });
    if (!trade || !workItem) continue;
    const existing = await prisma.constructionProductivityNorm.findFirst({
      where: { tradeId: trade.id, workItemId: workItem.id, deletedAt: null },
    });
    const payload = {
      outputPerDay: norm.outputPerDay,
      unit: norm.unit,
      crewComposition: norm.crewComposition,
      sourceType: 'ESTIMATED_FALLBACK' as const,
      confidence: 'LOW' as const,
      effectiveFrom: new Date('2026-01-01'),
    };
    if (existing) {
      await prisma.constructionProductivityNorm.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.constructionProductivityNorm.create({
        data: { id: randomUUID(), tradeId: trade.id, workItemId: workItem.id, ...payload },
      });
    }
  }

  for (const rule of WASTAGE_RULES) {
    await prisma.constructionWastageRule.upsert({
      where: { categoryKey: rule.key },
      update: { label: rule.label, wastagePercent: rule.percent, deletedAt: null },
      create: {
        id: randomUUID(),
        categoryKey: rule.key,
        label: rule.label,
        wastagePercent: rule.percent,
      },
    });
  }

  const standardTier = await prisma.constructionQualityTier.upsert({
    where: { code: 'STANDARD' },
    update: { name: 'Standard', sortOrder: 2, deletedAt: null },
    create: { id: randomUUID(), code: 'STANDARD', name: 'Standard', sortOrder: 2 },
  });
  for (const tier of QUALITY_TIERS) {
    await prisma.constructionQualityTier.upsert({
      where: { code: tier.code },
      update: { name: tier.name, sortOrder: tier.sortOrder, deletedAt: null },
      create: {
        id: randomUUID(),
        code: tier.code,
        name: tier.name,
        sortOrder: tier.sortOrder,
      },
    });
  }

  for (const tier of QUALITY_TIERS) {
    const row = await prisma.constructionQualityTier.findUnique({ where: { code: tier.code } });
    if (!row) continue;
    for (const spec of QUALITY_SPECIFICATIONS[tier.code] ?? []) {
      await prisma.constructionQualitySpecification.upsert({
        where: { tierId_categoryKey: { tierId: row.id, categoryKey: spec.categoryKey } },
        update: { specKey: spec.specKey, label: spec.label },
        create: {
          id: randomUUID(),
          tierId: row.id,
          categoryKey: spec.categoryKey,
          specKey: spec.specKey,
          label: spec.label,
        },
      });
    }
  }

  for (const rule of DEFAULT_COMMERCIAL_RULES) {
    await prisma.constructionCommercialRule.upsert({
      where: { locationId_kind: { locationId: india.id, kind: rule.kind } },
      update: {
        percent: rule.percent,
        indexFactor: rule.indexFactor,
        sourceType: 'ESTIMATED_FALLBACK',
        confidence: 'LOW',
        notes: rule.notes,
        effectiveFrom: new Date('2026-01-01'),
        deletedAt: null,
      },
      create: {
        id: randomUUID(),
        locationId: india.id,
        kind: rule.kind,
        percent: rule.percent,
        indexFactor: rule.indexFactor,
        sourceType: 'ESTIMATED_FALLBACK',
        confidence: 'LOW',
        notes: rule.notes,
        effectiveFrom: new Date('2026-01-01'),
      },
    });
  }

  const existingReview = await prisma.constructionRateReview.findFirst({
    where: { resourceKey: 'national-planning-baseline' },
  });
  if (!existingReview) {
    await prisma.constructionRateReview.create({
      data: {
        id: randomUUID(),
        resourceType: 'MATERIAL',
        resourceKey: 'national-planning-baseline',
        locationId: india.id,
        status: 'OPEN',
        reason:
          'No official city selling prices are loaded. Keep public labels as indicative planning rates until a dated SOR extract is ingested.',
      },
    });
  }

  for (const item of INTERIORS) {
    await prisma.constructionInteriorComponent.upsert({
      where: { slug: item.slug },
      update: { name: item.name, roomType: item.roomType, unit: item.unit, deletedAt: null },
      create: {
        id: randomUUID(),
        slug: item.slug,
        name: item.name,
        roomType: item.roomType,
        unit: item.unit,
      },
    });
  }

  const specSeeds = [
    {
      materialSlug: 'opc-53-cement',
      slug: 'opc-53-50kg',
      name: 'OPC 53 50kg bag',
      unit: '50kg bag',
    },
    { materialSlug: 'tmt-fe500d', slug: 'fe500d-12mm', name: 'TMT Fe500D 12mm', unit: 'kg' },
  ];
  for (const spec of specSeeds) {
    const material = await prisma.constructionMaterial.findUnique({
      where: { slug: spec.materialSlug },
    });
    if (!material) continue;
    await prisma.constructionMaterialSpecification.upsert({
      where: { materialId_slug: { materialId: material.id, slug: spec.slug } },
      update: { name: spec.name, unit: spec.unit, deletedAt: null },
      create: {
        id: randomUUID(),
        materialId: material.id,
        slug: spec.slug,
        name: spec.name,
        unit: spec.unit,
      },
    });
  }

  const existingBenchmark = await prisma.constructionBenchmarkRate.findFirst({
    where: { locationId: india.id, buildingType: 'independent_house', deletedAt: null },
  });
  const benchmarkData = {
    minRatePerSqFt: Math.round(NATIONAL_BASE_RATE_PER_SQFT * 0.88),
    averageRatePerSqFt: NATIONAL_BASE_RATE_PER_SQFT,
    maxRatePerSqFt: Math.round(NATIONAL_BASE_RATE_PER_SQFT * 1.12),
    sourceType: 'ESTIMATED_FALLBACK' as const,
    confidence: 'LOW' as const,
    isDerived: true,
    effectiveFrom: new Date('2026-01-01'),
    notes:
      'Indicative planning ₹/sq ft for quick estimates only. Not an official city SOR. Detailed BOQ must use quantity × resolved local rates.',
    qualityTierId: standardTier.id,
  };
  if (existingBenchmark) {
    await prisma.constructionBenchmarkRate.update({
      where: { id: existingBenchmark.id },
      data: benchmarkData,
    });
  } else {
    await prisma.constructionBenchmarkRate.create({
      data: {
        id: randomUUID(),
        locationId: india.id,
        buildingType: 'independent_house',
        ...benchmarkData,
      },
    });
  }
}
