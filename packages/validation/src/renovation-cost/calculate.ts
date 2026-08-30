import {
  RENOVATION_CALC_VERSION,
  RENOVATION_PROPERTY_MULTIPLIERS,
  RENOVATION_RANGE_SPREAD,
  RENOVATION_WORK_RATES,
  ageMultiplier,
  computeWorkAmount,
  getWorkRateMeta,
  normalizeLocationKey,
  toSqft,
  LOCATION_MULTIPLIERS,
} from './rates';
import {
  renovationCostInputSchema,
  type RenovationBreakdownLine,
  type RenovationCostInput,
  type RenovationCostResult,
} from './types';

function roundMoney(n: number): number {
  return Math.round(n);
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

  const enabledItems = input.workItems.filter((w) => w.enabled);
  if (enabledItems.length === 0) {
    throw new Error('Select at least one renovation work category.');
  }

  const workBreakdown: RenovationBreakdownLine[] = [];

  for (const meta of RENOVATION_WORK_RATES) {
    const item = input.workItems.find((w) => w.id === meta.id);
    const enabled = Boolean(item?.enabled);
    const quality = item?.quality ?? 'standard';
    const rawAmount = enabled ? computeWorkAmount(meta, quality, areaSqft) : 0;
    const amount = enabled
      ? roundMoney(rawAmount * locationMultiplier * propertyMultiplier * ageMult)
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
    rangeLow,
    rangeHigh,
    contingencyAmount,
    contingencyPercent,
    workBreakdown,
    topCostDrivers: drivers,
    assumptions: [
      `Renovation area ${areaSqft} sq ft in ${locationMeta.label} (×${locationMultiplier}).`,
      `Property type ${input.propertyType} (×${propertyMultiplier}); age ${input.propertyAgeYears} years (×${ageMult}).`,
      `Selected work: ${selectedLabels}.`,
      `Contingency ${contingencyPercent}% on work subtotal.`,
      'Rates are indicative Indian market planning figures — not contractor quotations.',
      'Hidden damage, design changes and brand upgrades often increase real costs.',
    ],
    methodology: {
      title: 'How Varnarc calculated this renovation estimate',
      steps: [
        'Sum selected work categories at basic / standard / premium rates (per sq ft or fixed packages).',
        `Apply location multiplier (×${locationMultiplier}) and property-type multiplier (×${propertyMultiplier}).`,
        `Apply age adjustment (×${ageMult}) for older-property prep and repairs.`,
        `Add contingency (${contingencyPercent}%).`,
        `Publish a likely range of ±${Math.round(RENOVATION_RANGE_SPREAD * 100)}% around the mid estimate.`,
      ],
    },
    disclaimer:
      'This renovation estimate is an indicative planning figure for education only. It is not a quotation, tender, or guarantee of actual renovation cost. Always verify with local contractors before budgeting.',
    version: RENOVATION_CALC_VERSION,
  };
}

export function defaultRenovationWorkItems(): RenovationCostInput['workItems'] {
  return RENOVATION_WORK_RATES.map((w) => ({
    id: w.id,
    enabled: ['painting', 'flooring', 'electrical', 'plumbing'].includes(w.id),
    quality: 'standard' as const,
  }));
}
