import { normalizeLocationKey, toSqft } from '../construction-cost/rates';
import {
  MATERIAL_LINE_META,
  MATERIAL_QUANTITY_CALC_VERSION,
  MATERIAL_QUANTITY_DISCLAIMER,
  cityRateMultipliers,
  constructionMaterialFactors as factors,
  floorStructureIncrement,
  foundationTypeFactors,
  materialCostSplit,
  materialRates,
  qualityMultipliers,
  slabTypeFactors,
  structureTypeFactors,
  wallTypeFactors,
  type MaterialLineId,
} from './rates';
import {
  materialQuantityInputSchema,
  type MaterialQuantityLine,
  type MaterialQuantityParsedInput,
  type MaterialQuantityResult,
} from './types';

function roundMoney(n: number): number {
  return Math.round(n);
}

function roundQty(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

function groupMultiplier(
  group: (typeof MATERIAL_LINE_META)[MaterialLineId]['group'],
  input: MaterialQuantityParsedInput,
): number {
  const structure = structureTypeFactors[input.structureType];
  const slab = slabTypeFactors[input.slabType];
  const foundation = foundationTypeFactors[input.foundationType];
  const wall = wallTypeFactors[input.wallType];
  const floorAdj = 1 + Math.max(0, input.floors - 1) * floorStructureIncrement;
  const quality = qualityMultipliers[input.quality] ?? 1;
  const wastage = 1 + input.wastagePercent / 100;

  if (group === 'structural') {
    return (
      quality * floorAdj * structure.structural * slab.structural * foundation.structural * wastage
    );
  }
  if (group === 'masonry') {
    return quality * structure.masonry * wall.masonry * wastage;
  }
  if (group === 'finishing') {
    return quality * structure.finishing * slab.finishing * wastage;
  }
  return quality * wastage;
}

function baseQuantity(
  id: MaterialLineId,
  areaSqft: number,
  wallType: MaterialQuantityParsedInput['wallType'],
): number {
  if (id === 'cement') return areaSqft * factors.cementBags;
  if (id === 'steel') return areaSqft * factors.steelKg;
  if (id === 'sand') return areaSqft * factors.sandTonnes;
  if (id === 'aggregate') return areaSqft * factors.aggregateTonnes;
  if (id === 'masonry') {
    return wallType === 'aac' ? areaSqft * factors.aacBlocks : areaSqft * factors.bricks;
  }
  if (id === 'tiles') return areaSqft * factors.tilesSqft;
  if (id === 'paint') return areaSqft * factors.paintLitres;
  if (id === 'electrical') return areaSqft * factors.electricalSqft;
  return areaSqft * factors.plumbingSqft;
}

function rateFor(
  id: MaterialLineId,
  input: MaterialQuantityParsedInput,
  cityMultiplier: number,
): number {
  const custom = input.customRates;
  const base =
    id === 'cement'
      ? (custom?.cementPerBag ?? materialRates.cementPerBag)
      : id === 'steel'
        ? (custom?.steelPerKg ?? materialRates.steelPerKg)
        : id === 'sand'
          ? (custom?.sandPerTonne ?? materialRates.sandPerTonne)
          : id === 'aggregate'
            ? (custom?.aggregatePerTonne ?? materialRates.aggregatePerTonne)
            : id === 'masonry'
              ? input.wallType === 'aac'
                ? (custom?.aacBlockEach ?? materialRates.aacBlockEach)
                : (custom?.brickEach ?? materialRates.brickEach)
              : id === 'tiles'
                ? (custom?.tilePerSqft ?? materialRates.tilePerSqft)
                : id === 'paint'
                  ? (custom?.paintPerLitre ?? materialRates.paintPerLitre)
                  : id === 'electrical'
                    ? (custom?.electricalPerSqft ?? materialRates.electricalPerSqft)
                    : (custom?.plumbingPerSqft ?? materialRates.plumbingPerSqft);
  const usesCustom =
    (id === 'cement' && custom?.cementPerBag != null) ||
    (id === 'steel' && custom?.steelPerKg != null) ||
    (id === 'sand' && custom?.sandPerTonne != null) ||
    (id === 'aggregate' && custom?.aggregatePerTonne != null) ||
    (id === 'masonry' &&
      ((input.wallType === 'aac' && custom?.aacBlockEach != null) ||
        (input.wallType !== 'aac' && custom?.brickEach != null))) ||
    (id === 'tiles' && custom?.tilePerSqft != null) ||
    (id === 'paint' && custom?.paintPerLitre != null) ||
    (id === 'electrical' && custom?.electricalPerSqft != null) ||
    (id === 'plumbing' && custom?.plumbingPerSqft != null);
  return usesCustom ? base : roundQty(base * cityMultiplier, 2);
}

function customFactor(id: MaterialLineId, input: MaterialQuantityParsedInput): number {
  const f = input.customFactors;
  if (!f) return 1;
  if (id === 'masonry') return f.masonry ?? 1;
  return f[id] ?? 1;
}

function decimalsFor(id: MaterialLineId): number {
  if (id === 'sand' || id === 'aggregate') return 1;
  return 0;
}

export function calculateMaterialQuantities(raw: unknown): MaterialQuantityResult {
  const parsed = materialQuantityInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? 'Invalid material quantity inputs.');
  }
  const input = parsed.data;
  const areaSqft = toSqft(input.builtUpArea, input.areaUnit);
  const locationKey = normalizeLocationKey(input.location);
  const cityMultiplier = cityRateMultipliers[locationKey] ?? cityRateMultipliers.default ?? 1;
  const wall = wallTypeFactors[input.wallType];

  const ids: MaterialLineId[] = [
    'cement',
    'steel',
    'sand',
    'aggregate',
    'masonry',
    'tiles',
    'paint',
    'electrical',
    'plumbing',
  ];

  const lines: MaterialQuantityLine[] = ids.map((id) => {
    const meta = MATERIAL_LINE_META[id];
    const qty = roundQty(
      baseQuantity(id, areaSqft, input.wallType) *
        groupMultiplier(meta.group, input) *
        customFactor(id, input),
      decimalsFor(id),
    );
    const label =
      id === 'masonry'
        ? wall.masonryKind === 'aac'
          ? 'Bricks / AAC blocks'
          : 'Bricks / AAC blocks'
        : meta.label;
    const rate = rateFor(id, input, cityMultiplier);
    return {
      id,
      label,
      quantity: qty,
      unit: id === 'masonry' && wall.masonryKind === 'aac' ? 'pieces' : meta.unit,
      rate,
      estimatedCost: roundMoney(qty * rate),
    };
  });

  const materialCost = lines.reduce((sum, line) => sum + line.estimatedCost, 0);
  const splitSum =
    materialCostSplit.materialPercent +
    materialCostSplit.labourPercent +
    materialCostSplit.otherPercent;
  const impliedProjectTotal = roundMoney(
    materialCost / (materialCostSplit.materialPercent / splitSum),
  );
  const labourCost = roundMoney(impliedProjectTotal * (materialCostSplit.labourPercent / splitSum));
  const otherCost = impliedProjectTotal - materialCost - labourCost;

  return {
    version: MATERIAL_QUANTITY_CALC_VERSION,
    areaSqft,
    floors: input.floors,
    quality: input.quality,
    locationKey,
    locationMultiplier: cityMultiplier,
    wastagePercent: input.wastagePercent,
    lines,
    materialCost,
    labourSharePercent: materialCostSplit.labourPercent,
    materialSharePercent: materialCostSplit.materialPercent,
    otherSharePercent: materialCostSplit.otherPercent,
    impliedProjectTotal,
    labourCost,
    otherCost,
    formula:
      'qty = areaSqft × factor × quality × structure/wall/slab/foundation × floorAdj(structural) × (1 + wastage%) × customFactor; cost = qty × (customRate or baseRate × cityMultiplier)',
    assumptions: [
      'Quantities are whole-house planning thumb rules, not a bar-bending schedule or mix design.',
      'Built-up area is treated as total built-up across floors, not plot area.',
      `Default wastage is ${input.wastagePercent}%.`,
      'Electrical and plumbing use ₹/sq ft service allowances, not a point schedule.',
      MATERIAL_QUANTITY_DISCLAIMER,
    ],
    disclaimer: MATERIAL_QUANTITY_DISCLAIMER,
  };
}
