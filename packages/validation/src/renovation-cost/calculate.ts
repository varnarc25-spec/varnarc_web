import {
  BHK_MULTIPLIERS,
  FLOORING_TYPE_MULTIPLIERS,
  KITCHEN_CABINET_MULTIPLIERS,
  KITCHEN_COUNTER_MULTIPLIERS,
  KITCHEN_SIZE_MULTIPLIERS,
  LOCATION_MULTIPLIERS,
  PAINT_SCOPE_MULTIPLIERS,
  RENOVATION_CALC_VERSION,
  RENOVATION_COST_SPLIT,
  RENOVATION_PROPERTY_MULTIPLIERS,
  RENOVATION_RANGE_SPREAD,
  RENOVATION_WORK_RATES,
  ageMultiplier,
  computeWorkAmount,
  getWorkRateMeta,
  normalizeLocationKey,
  toSqft,
} from './rates';
import { resolveConstructionCostRateDisplay } from '../construction-location-catalog';
import {
  renovationCostInputSchema,
  type RenovationBreakdownLine,
  type RenovationCostInput,
  type RenovationCostResult,
  type RenovationWorkDetails,
  type RenovationWorkId,
} from './types';

function roundMoney(n: number): number {
  return Math.round(n);
}

function categoryAreaAndFactor(
  id: RenovationWorkId,
  areaSqft: number,
  details: RenovationWorkDetails | undefined,
): { area: number; factor: number } {
  const d = details ?? {};
  if (id === 'painting' && d.painting) {
    const p = d.painting;
    const area = p.paintArea && p.paintArea > 0 ? p.paintArea : areaSqft;
    const factor = PAINT_SCOPE_MULTIPLIERS[p.scope ?? 'interior'];
    return { area, factor };
  }
  if (id === 'flooring' && d.flooring) {
    const f = d.flooring;
    const area = f.floorArea && f.floorArea > 0 ? f.floorArea : areaSqft;
    const typeMult = FLOORING_TYPE_MULTIPLIERS[f.flooringType ?? 'vitrified'];
    const demo = f.demolition ? 1.18 : 1;
    return { area, factor: typeMult * demo };
  }
  if (id === 'kitchen' && d.kitchen) {
    const k = d.kitchen;
    const factor =
      KITCHEN_SIZE_MULTIPLIERS[k.kitchenSize ?? 'standard'] *
      KITCHEN_CABINET_MULTIPLIERS[k.cabinetType ?? 'modular'] *
      KITCHEN_COUNTER_MULTIPLIERS[k.countertop ?? 'granite'];
    return { area: areaSqft, factor };
  }
  if (id === 'bathroom' && d.bathroom) {
    const count = d.bathroom.bathroomCount ?? 1;
    return { area: areaSqft, factor: Math.max(1, count) };
  }
  return { area: areaSqft, factor: 1 };
}

/**
 * Renovation Cost Calculator — pure function.
 * Estimates are indicative planning figures, never guaranteed quotes.
 */
export function calculateRenovationCost(raw: RenovationCostInput): RenovationCostResult {
  const input = renovationCostInputSchema.parse(raw);
  const areaSqft = toSqft(input.renovationArea, input.areaUnit);
  const locationKey = normalizeLocationKey(input.location);
  const locationMeta = LOCATION_MULTIPLIERS[locationKey] ?? LOCATION_MULTIPLIERS.default!;
  const locationMultiplier = input.overrides?.locationMultiplier ?? locationMeta.multiplier;
  const propertyMultiplier = RENOVATION_PROPERTY_MULTIPLIERS[input.propertyType];
  const ageMult = ageMultiplier(input.propertyAgeYears);
  const bhkMult = BHK_MULTIPLIERS[input.roomsBhk ?? 'na'] ?? 1;

  const workItems = input.workItems.map((w) => ({
    ...w,
    quality: input.finishTier ?? w.quality,
  }));

  const enabledItems = workItems.filter((w) => w.enabled);
  if (enabledItems.length === 0) {
    throw new Error('Select at least one renovation work category.');
  }

  const workBreakdown: RenovationBreakdownLine[] = [];

  for (const meta of RENOVATION_WORK_RATES) {
    const item = workItems.find((w) => w.id === meta.id);
    const enabled = Boolean(item?.enabled);
    const quality = item?.quality ?? 'standard';
    const { area, factor } = categoryAreaAndFactor(meta.id, areaSqft, input.workDetails);
    const rawAmount = enabled ? computeWorkAmount(meta, quality, area) * factor : 0;
    const amount = enabled
      ? roundMoney(rawAmount * locationMultiplier * propertyMultiplier * ageMult * bhkMult)
      : 0;
    workBreakdown.push({
      id: meta.id,
      label: meta.label,
      quality: enabled ? quality : 'n/a',
      amount,
      percentOfTotal: 0,
      enabled,
    });
  }

  // Include any unknown ids from input (shouldn't happen with zod) — skip

  const workSubtotal = workBreakdown.reduce((s, l) => s + l.amount, 0);
  const contingencyPercent = input.contingencyPercent ?? 12;
  const contingencyAmount = roundMoney((workSubtotal * contingencyPercent) / 100);
  const estimatedTotal = workSubtotal + contingencyAmount;

  const safeTotal = estimatedTotal > 0 ? estimatedTotal : 1;
  for (const line of workBreakdown) {
    line.percentOfTotal = Math.round((line.amount / safeTotal) * 1000) / 10;
  }

  workBreakdown.push({
    id: 'contingency',
    label: 'Contingency',
    quality: 'n/a',
    amount: contingencyAmount,
    percentOfTotal: Math.round((contingencyAmount / safeTotal) * 1000) / 10,
    enabled: true,
  });

  const drivers = [...workBreakdown]
    .filter((l) => l.id !== 'contingency' && l.enabled && l.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((l) => ({
      id: l.id,
      label: l.label,
      amount: l.amount,
      percentOfTotal: l.percentOfTotal,
    }));

  const rangeLow = roundMoney(estimatedTotal * (1 - RENOVATION_RANGE_SPREAD));
  const rangeHigh = roundMoney(estimatedTotal * (1 + RENOVATION_RANGE_SPREAD));
  const costPerSqft = areaSqft > 0 ? roundMoney(estimatedTotal / areaSqft) : 0;
  const materialCost = roundMoney((estimatedTotal * RENOVATION_COST_SPLIT.materialPercent) / 100);
  const labourCost = roundMoney((estimatedTotal * RENOVATION_COST_SPLIT.labourPercent) / 100);
  const otherCost = roundMoney(estimatedTotal - materialCost - labourCost);

  const selectedLabels = enabledItems.map((w) => getWorkRateMeta(w.id).label).join(', ');

  return {
    currency: 'INR',
    areaSqft,
    locationKey,
    locationLabel: locationMeta.label,
    propertyType: input.propertyType,
    propertyAgeYears: input.propertyAgeYears,
    ageMultiplier: ageMult,
    locationMultiplier,
    propertyMultiplier,
    costPerSqft,
    estimatedTotal,
    materialCost,
    labourCost,
    otherCost,
    rangeLow,
    rangeHigh,
    contingencyAmount,
    contingencyPercent,
    workBreakdown,
    topCostDrivers: drivers,
    assumptions: [
      `Renovation area ${areaSqft} sq ft in ${locationMeta.label} (×${locationMultiplier}).`,
      `Property type ${input.propertyType} (×${propertyMultiplier}); rooms ${input.roomsBhk ?? 'na'} (×${bhkMult}); age ${input.propertyAgeYears} years (×${ageMult}).`,
      `Selected work: ${selectedLabels}.`,
      `Contingency ${contingencyPercent}% on work subtotal.`,
      `Planning split ${RENOVATION_COST_SPLIT.materialPercent}% materials / ${RENOVATION_COST_SPLIT.labourPercent}% labour / ${RENOVATION_COST_SPLIT.otherPercent}% other — not a contractor bid.`,
      'Rates are indicative Indian market planning figures — local labour and material prices vary.',
      'Hidden damage, design changes and brand upgrades often increase real costs.',
    ],
    rateDisplay: resolveConstructionCostRateDisplay(input.location),
    methodology: {
      title: 'How Varnarc calculated this renovation estimate',
      steps: [
        'Sum selected work categories at basic / standard / premium rates (per sq ft or fixed packages).',
        `Apply location multiplier (×${locationMultiplier}), property-type (×${propertyMultiplier}) and BHK/size (×${bhkMult}).`,
        `Apply age adjustment (×${ageMult}) for older-property prep and repairs.`,
        `Add contingency (${contingencyPercent}%).`,
        `Publish a likely range of ±${Math.round(RENOVATION_RANGE_SPREAD * 100)}% around the mid estimate.`,
      ],
    },
    disclaimer:
      'This renovation estimate is an indicative planning figure. Local labour, material brands and hidden repairs change actual cost. It is not a quotation, tender, or guarantee. Always verify with local contractors before budgeting.',
    version: RENOVATION_CALC_VERSION,
  };
}

export function defaultRenovationWorkItems(): RenovationCostInput['workItems'] {
  return RENOVATION_WORK_RATES.map((w) => ({
    id: w.id,
    enabled: ['painting', 'kitchen', 'bathroom'].includes(w.id),
    quality: 'standard' as const,
  }));
}
