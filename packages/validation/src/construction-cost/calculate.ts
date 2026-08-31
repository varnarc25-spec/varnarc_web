import {
  CATEGORY_SHARES,
  COST_CALC_VERSION,
  DEFAULT_COST_SPLIT,
  DEFAULT_MARKET_RATES,
  FEATURE_COSTS,
  FOUNDATION_MULTIPLIERS,
  INTERIOR_MULTIPLIERS,
  LOCATION_MULTIPLIERS,
  NATIONAL_BASE_RATE_PER_SQFT,
  PHASE_SHARES,
  PROPERTY_TYPE_MULTIPLIERS,
  QUALITY_MULTIPLIERS,
  QUALITY_QTY_FACTOR,
  RANGE_SPREAD,
  RATE_QTY_PER_SQFT,
  STRUCTURE_MULTIPLIERS,
  normalizeLocationKey,
  toSqft,
} from './rates';
import {
  buildReverseCalculationDisplay,
  REVERSE_CALC_COMMON_LIMITATIONS,
} from '../reverse-calculator';
import {
  constructionCostInputSchema,
  type ConstructionCostInputRaw,
  type ConstructionCostResult,
  type CostBreakdownLine,
} from './types';

function roundMoney(n: number): number {
  return Math.round(n);
}

const SQFT_TO_SQM = 0.09290304;

function line(id: string, label: string, amount: number, total: number): CostBreakdownLine {
  const safeTotal = total > 0 ? total : 1;
  return {
    id,
    label,
    amount: roundMoney(amount),
    percentOfTotal: Math.round((amount / safeTotal) * 1000) / 10,
  };
}

/**
 * Flagship Construction Cost Calculator.
 * Forward: area → cost. Reverse: budget → approximate buildable area (same rate model).
 */
export function calculateConstructionCost(raw: ConstructionCostInputRaw): ConstructionCostResult {
  const input = constructionCostInputSchema.parse(raw);
  const locationKey = normalizeLocationKey(input.location);
  const locationMeta = LOCATION_MULTIPLIERS[locationKey] ?? LOCATION_MULTIPLIERS.default!;

  const qualityMultiplier = QUALITY_MULTIPLIERS[input.quality];
  const floorMultiplier = 1 + Math.max(0, input.floors - 1) * 0.04;
  const foundationMultiplier = input.foundationType
    ? FOUNDATION_MULTIPLIERS[input.foundationType]
    : 1;
  const structureMultiplier = input.structureType ? STRUCTURE_MULTIPLIERS[input.structureType] : 1;
  const interiorMultiplier = input.interiorLevel ? INTERIOR_MULTIPLIERS[input.interiorLevel] : 1;
  const propertyMultiplier = PROPERTY_TYPE_MULTIPLIERS[input.propertyType];
  const locationMultiplier = locationMeta.multiplier;

  const baseRatePerSqft =
    input.overrides?.baseRatePerSqft ?? input.customCostPerSqft ?? NATIONAL_BASE_RATE_PER_SQFT;

  const derivedRate =
    baseRatePerSqft *
    qualityMultiplier *
    floorMultiplier *
    foundationMultiplier *
    structureMultiplier *
    interiorMultiplier *
    propertyMultiplier *
    locationMultiplier;

  const costPerSqft = input.customCostPerSqft ? input.customCostPerSqft : Math.round(derivedRate);

  const contingencyPercent = input.contingencyPercent ?? 10;
  const contingencyFactor = 1 + contingencyPercent / 100;

  const isReverse = input.mode === 'reverse';
  let areaSqft: number;
  const reverseFormula = 'area_sqft ≈ budget / (cost_per_sqft × (1 + contingency%))';
  let reverseLimitations: string[] = [];

  if (isReverse) {
    const budget = input.budgetInr!;
    areaSqft = budget / (costPerSqft * contingencyFactor);
    reverseLimitations = [
      ...REVERSE_CALC_COMMON_LIMITATIONS,
      'Reverse size ignores optional features (basement, lift, parking, kitchen, compound wall) — enabling them reduces buildable area for the same budget.',
      'Uses the same indicative rate model as the forward cost calculator — not a bank sanction or contractor quote.',
    ];
  } else {
    areaSqft = toSqft(input.builtUpArea!, input.areaUnit);
  }

  const shellCost = areaSqft * costPerSqft;

  const featureCosts: Array<{ id: string; label: string; amount: number }> = [];
  if (!isReverse) {
    if (input.basement) {
      featureCosts.push({
        id: 'basement',
        label: 'Basement',
        amount: roundMoney(areaSqft * FEATURE_COSTS.basementPerSqftFactor * costPerSqft),
      });
    }
    if ((input.parkingSlots ?? 0) > 0) {
      featureCosts.push({
        id: 'parking',
        label: `Parking (${input.parkingSlots} slots)`,
        amount: roundMoney((input.parkingSlots ?? 0) * FEATURE_COSTS.parkingPerSlot),
      });
    }
    if (input.lift) {
      featureCosts.push({
        id: 'lift',
        label: 'Lift',
        amount: FEATURE_COSTS.lift,
      });
    }
    if (input.compoundWall) {
      featureCosts.push({
        id: 'compound_wall',
        label: 'Compound wall',
        amount: FEATURE_COSTS.compoundWall,
      });
    }
    if (input.modularKitchen) {
      featureCosts.push({
        id: 'modular_kitchen',
        label: 'Modular kitchen',
        amount: FEATURE_COSTS.modularKitchen[input.quality],
      });
    }
  }

  const featuresTotal = featureCosts.reduce((s, f) => s + f.amount, 0);
  const preContingency = shellCost + featuresTotal;

  const materialPercent = input.overrides?.materialPercent ?? DEFAULT_COST_SPLIT.materialPercent;
  const labourPercent = input.overrides?.labourPercent ?? DEFAULT_COST_SPLIT.labourPercent;
  const miscPercent = input.overrides?.miscPercent ?? DEFAULT_COST_SPLIT.miscPercent;
  const splitSum = materialPercent + labourPercent + miscPercent;
  const mShare = materialPercent / splitSum;
  const lShare = labourPercent / splitSum;
  const xShare = miscPercent / splitSum;

  const materialCostBase = roundMoney(preContingency * mShare);
  const labourCostBase = roundMoney(preContingency * lShare);
  const miscellaneousCost = roundMoney(preContingency * xShare);

  const qtyFactor = QUALITY_QTY_FACTOR[input.quality] ?? 1;
  const steelRate = input.overrides?.steelRatePerKg ?? DEFAULT_MARKET_RATES.steelRatePerKg;
  const cementRate = input.overrides?.cementRatePerBag ?? DEFAULT_MARKET_RATES.cementRatePerBag;
  const labourIndex = input.overrides?.labourRateIndex ?? DEFAULT_MARKET_RATES.labourRateIndex;

  const steelKg = areaSqft * RATE_QTY_PER_SQFT.steelKg * qtyFactor;
  const cementBags = areaSqft * RATE_QTY_PER_SQFT.cementBags * qtyFactor;
  const steelDelta = (steelRate - DEFAULT_MARKET_RATES.steelRatePerKg) * steelKg;
  const cementDelta = (cementRate - DEFAULT_MARKET_RATES.cementRatePerBag) * cementBags;
  const labourDelta = labourCostBase * (labourIndex / DEFAULT_MARKET_RATES.labourRateIndex - 1);

  const materialCost = roundMoney(materialCostBase + steelDelta + cementDelta);
  const labourCost = roundMoney(labourCostBase + labourDelta);
  const rebuilt = materialCost + labourCost + miscellaneousCost;

  const contingencyAmount = roundMoney((rebuilt * contingencyPercent) / 100);
  const estimatedTotal = rebuilt + contingencyAmount;

  const rangeLow = roundMoney(estimatedTotal * (1 - RANGE_SPREAD));
  const rangeHigh = roundMoney(estimatedTotal * (1 + RANGE_SPREAD));

  const categoryBreakdown = CATEGORY_SHARES.map((c) =>
    line(c.id, c.label, rebuilt * c.share, estimatedTotal),
  );
  categoryBreakdown.push(line('contingency', 'Contingency', contingencyAmount, estimatedTotal));

  const phaseBase = rebuilt;
  const phaseBreakdown = PHASE_SHARES.map((p) =>
    line(p.id, p.label, phaseBase * p.share, estimatedTotal),
  );
  phaseBreakdown.push(line('contingency', 'Contingency', contingencyAmount, estimatedTotal));

  const floorBreakdown: CostBreakdownLine[] = [];
  if (input.floors > 1) {
    const groundShare = 0.38;
    const upperShare = (1 - groundShare) / (input.floors - 1);
    floorBreakdown.push(line('floor-0', 'Ground floor', rebuilt * groundShare, estimatedTotal));
    for (let f = 1; f < input.floors; f++) {
      floorBreakdown.push(line(`floor-${f}`, `Floor ${f}`, rebuilt * upperShare, estimatedTotal));
    }
    floorBreakdown.push(line('contingency', 'Contingency', contingencyAmount, estimatedTotal));
  } else {
    floorBreakdown.push(line('floor-0', 'Single level / total', rebuilt, estimatedTotal));
    floorBreakdown.push(line('contingency', 'Contingency', contingencyAmount, estimatedTotal));
  }

  const buildMonths = Math.min(36, Math.max(8, Math.round(10 + input.floors * 3)));
  const monthlyCashRequirement = roundMoney(estimatedTotal / buildMonths);

  let confidenceScore = 0.72;
  if (locationKey !== 'default') confidenceScore += 0.08;
  if (input.customCostPerSqft || input.overrides?.baseRatePerSqft) confidenceScore += 0.06;
  if (input.foundationType && input.structureType) confidenceScore += 0.04;
  if (input.propertyType === 'renovation') confidenceScore -= 0.08;
  if (areaSqft < 400 || areaSqft > 12000) confidenceScore -= 0.05;
  if (isReverse) confidenceScore -= 0.06;
  confidenceScore = Math.max(0.4, Math.min(0.92, confidenceScore));
  const confidence = confidenceScore >= 0.8 ? 'high' : confidenceScore >= 0.65 ? 'medium' : 'low';

  const areaSqm = Math.round(areaSqft * SQFT_TO_SQM * 10) / 10;
  const selectedUnit = input.areaUnit === 'sqm' ? 'sqm' : 'sqft';

  const assumptions = [
    `Base rate ₹${roundMoney(baseRatePerSqft)}/sqft (${input.customCostPerSqft ? 'custom override' : 'national indicative'}) for ${locationMeta.label}.`,
    `Quality multiplier ×${qualityMultiplier} (${input.quality}).`,
    `Floor multiplier ×${floorMultiplier.toFixed(2)} for ${input.floors} floor(s).`,
    `Location multiplier ×${locationMultiplier}.`,
    `Cost split material ${Math.round(mShare * 100)}% / labour ${Math.round(lShare * 100)}% / misc ${Math.round(xShare * 100)}%.`,
    `Market rates in model: steel ₹${steelRate}/kg, cement ₹${cementRate}/bag, labour index ${labourIndex}.`,
    `Contingency ${contingencyPercent}% on subtotal.`,
    ...(isReverse
      ? [
          `Budget ₹${roundMoney(input.budgetInr!)} inverted through rate × contingency to approximate built-up area.`,
          'Optional features are excluded from reverse size so the area answer stays interpretable.',
        ]
      : ['Category and phase shares are planning allocations, not contractor bills.']),
    'Always verify rates with local contractors and suppliers before budgeting.',
  ];

  const formula = isReverse
    ? reverseFormula
    : 'total ≈ (area_sqft × cost_per_sqft + features) × (1 + contingency%)';

  const limitations = isReverse
    ? reverseLimitations
    : [
        'Forward estimate is indicative planning only — not a quotation or tender.',
        'Local labour, material grades, design and market conditions change final prices.',
      ];

  return {
    mode: isReverse ? 'reverse' : 'forward',
    currency: 'INR',
    areaSqft: Math.round(areaSqft * 10) / 10,
    areaSqm,
    floors: input.floors,
    locationKey,
    locationLabel: locationMeta.label,
    quality: input.quality,
    propertyType: input.propertyType,
    costPerSqft: roundMoney(costPerSqft),
    baseRatePerSqft: roundMoney(baseRatePerSqft),
    qualityMultiplier,
    floorMultiplier,
    foundationMultiplier,
    structureMultiplier,
    interiorMultiplier,
    locationMultiplier,
    featureCosts,
    estimatedTotal,
    rangeLow,
    rangeHigh,
    materialCost,
    labourCost,
    miscellaneousCost,
    contingencyAmount,
    contingencyPercent,
    budgetInr: isReverse ? roundMoney(input.budgetInr!) : null,
    selectedUnit,
    formula,
    limitations,
    reverseDisplay: isReverse
      ? buildReverseCalculationDisplay({
          assumptions,
          selectedUnit,
          wastagePercent: contingencyPercent,
          wastageLabel: 'Contingency buffer',
          formula,
          limitations,
        })
      : null,
    confidence,
    confidenceScore,
    categoryBreakdown,
    phaseBreakdown,
    floorBreakdown,
    monthlyCashRequirement,
    assumptions,
    methodology: {
      title: isReverse ? 'How Varnarc reversed this budget' : 'How Varnarc calculated this',
      steps: isReverse
        ? [
            `Start from base location rate (₹${roundMoney(baseRatePerSqft)}/sqft) for ${locationMeta.label}.`,
            `Apply quality / floors / location multipliers → ₹${roundMoney(costPerSqft)}/sqft.`,
            `Reserve contingency ${contingencyPercent}%.`,
            `Approximate built-up area = budget ÷ (rate × (1 + contingency%)).`,
            `Re-run the planning split on that area for an indicative mid estimate near the budget.`,
          ]
        : [
            `Start from base location rate (₹${roundMoney(baseRatePerSqft)}/sqft) for ${locationMeta.label}.`,
            `Apply quality multiplier (${input.quality}: ×${qualityMultiplier}).`,
            `Apply floor multiplier (×${floorMultiplier.toFixed(2)}).`,
            input.foundationType
              ? `Apply foundation type (${input.foundationType}: ×${foundationMultiplier}).`
              : 'Foundation type left at default (×1.0).',
            input.structureType
              ? `Apply structure type (${input.structureType}: ×${structureMultiplier}).`
              : 'Structure type left at default (×1.0).',
            `Add optional features (${featureCosts.length} item(s), ₹${roundMoney(featuresTotal)}).`,
            `Split into material / labour / miscellaneous using configured percentages.`,
            `Adjust for steel / cement / labour rate overrides vs market defaults when provided.`,
            `Add contingency (${contingencyPercent}%).`,
            `Publish a likely range of ±${Math.round(RANGE_SPREAD * 100)}% around the mid estimate.`,
          ],
    },
    disclaimer:
      'This estimate is an indicative planning figure for education only. It is not a quotation, tender, or guarantee of actual construction cost. Local labour, material grades, design, and market conditions will change final prices. This model does not forecast future commodity prices.',
    version: COST_CALC_VERSION,
  };
}
