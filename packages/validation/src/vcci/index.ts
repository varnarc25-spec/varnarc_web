/** VCCI — Varnarc Construction Cost Index methodology & publication gates. */

export const VCCI_NAME = 'Varnarc Construction Cost Index';
export const VCCI_SHORT_NAME = 'VCCI';
export const VCCI_METHODOLOGY_VERSION = '2026.08.1';

export const VCCI_QUALIFICATION =
  'VCCI is an indicative planning index derived from observed/reference component series. It is not a contractor quote, tender schedule or live market feed. Local supplier and labour rates can differ materially.';

/** Baseline period for index = 100. */
export const VCCI_BASELINE = {
  label: 'Q1 2026',
  start: '2026-01-01',
  end: '2026-03-31',
  indexLevel: 100,
} as const;

export const VCCI_UPDATE_FREQUENCY =
  'Target cadence: monthly recompute after component source windows close. Mid-month revisions only when a source error is corrected. Snapshots are never back-filled with interpolated daily values.';

export const VCCI_COMPONENTS = [
  {
    key: 'cement',
    label: 'Cement',
    description:
      'Bagged OPC/PPC reference series linked to construction price observations where available.',
    defaultWeight: 0.14,
    sourceHint: 'Material price observations (cement) + editorial surveys',
  },
  {
    key: 'steel',
    label: 'Steel',
    description: 'TMT / rebar reference series by city or national aggregate.',
    defaultWeight: 0.16,
    sourceHint: 'Material price observations (steel/TMT)',
  },
  {
    key: 'aggregates',
    label: 'Aggregates',
    description: 'Coarse aggregate / jelly and related bulk materials.',
    defaultWeight: 0.08,
    sourceHint: 'Material price observations (aggregate) + plant quotes',
  },
  {
    key: 'masonry',
    label: 'Masonry',
    description: 'Bricks and AAC/block reference series.',
    defaultWeight: 0.1,
    sourceHint: 'Material price observations (brick/AAC)',
  },
  {
    key: 'labour',
    label: 'Labour',
    description:
      'Composite site labour cost rate series (skilled/unskilled blend per methodology notes).',
    defaultWeight: 0.25,
    sourceHint: 'Construction cost rates + regional labour surveys',
  },
  {
    key: 'finishing',
    label: 'Finishing',
    description: 'Paint, plaster and tile composite finishing basket.',
    defaultWeight: 0.12,
    sourceHint: 'Material price observations (paint/tiles/plaster proxies)',
  },
  {
    key: 'electrical',
    label: 'Electrical',
    description: 'Indicative electrical materials basket for residential shells.',
    defaultWeight: 0.08,
    sourceHint: 'Editorial electrical materials basket',
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    description: 'Indicative plumbing materials basket for residential shells.',
    defaultWeight: 0.07,
    sourceHint: 'Editorial plumbing materials basket',
  },
] as const;

export type VcciComponentKey = (typeof VCCI_COMPONENTS)[number]['key'];

export const VCCI_SCOPES = ['NATIONAL', 'CITY', 'COMPONENT'] as const;
export type VcciScope = (typeof VCCI_SCOPES)[number];

/** Minimum share of weighted components required before a snapshot may be published. */
export const VCCI_MIN_COMPONENT_COVERAGE = 0.75;
/** Maximum age (days) of a published “current” snapshot. */
export const VCCI_CURRENT_MAX_AGE_DAYS = 45;
/** Minimum history points for a public chart. */
export const VCCI_HISTORY_CHART_MIN_POINTS = 3;
/** Weight sum tolerance. */
export const VCCI_WEIGHT_SUM_TOLERANCE = 0.001;

export type VcciWeightMap = Partial<Record<VcciComponentKey, number>>;

export type VcciComponentContribution = {
  key: VcciComponentKey;
  label: string;
  weight: number;
  indexValue: number | null;
  available: boolean;
  sourceDataset?: string | null;
};

export type VcciQualityAssessment = {
  passed: boolean;
  blockers: string[];
  warnings: string[];
  coverageRatio: number;
  weightSum: number;
  componentCount: number;
  availableComponentCount: number;
};

export function isVcciComponentKey(value: string): value is VcciComponentKey {
  return VCCI_COMPONENTS.some((c) => c.key === value);
}

export function getVcciComponent(key: string) {
  return VCCI_COMPONENTS.find((c) => c.key === key);
}

export function defaultVcciWeights(): Record<VcciComponentKey, number> {
  return Object.fromEntries(VCCI_COMPONENTS.map((c) => [c.key, c.defaultWeight])) as Record<
    VcciComponentKey,
    number
  >;
}

export function sumVcciWeights(weights: VcciWeightMap): number {
  return VCCI_COMPONENTS.reduce((sum, c) => sum + (weights[c.key] ?? 0), 0);
}

/**
 * Laspeyres-style composite: sum(weight_i * index_i) / sum(weight_i for available i),
 * rebased only over available components. Missing components are excluded — never filled with 100.
 */
export function computeVcciCompositeIndex(input: {
  weights: VcciWeightMap;
  componentIndexes: Partial<Record<VcciComponentKey, number | null | undefined>>;
}): {
  indexValue: number | null;
  coverageRatio: number;
  contributions: VcciComponentContribution[];
} {
  const contributions: VcciComponentContribution[] = VCCI_COMPONENTS.map((c) => {
    const weight = input.weights[c.key] ?? c.defaultWeight;
    const raw = input.componentIndexes[c.key];
    const available = raw != null && Number.isFinite(raw) && raw > 0;
    return {
      key: c.key,
      label: c.label,
      weight,
      indexValue: available ? Number(raw) : null,
      available,
    };
  });

  const available = contributions.filter((c) => c.available && c.indexValue != null);
  const weightAvailable = available.reduce((s, c) => s + c.weight, 0);
  const weightAll = contributions.reduce((s, c) => s + c.weight, 0);
  const coverageRatio = weightAll > 0 ? weightAvailable / weightAll : 0;

  if (!available.length || weightAvailable <= 0) {
    return { indexValue: null, coverageRatio, contributions };
  }

  const weighted = available.reduce((s, c) => s + c.weight * (c.indexValue as number), 0);
  const indexValue = Math.round((weighted / weightAvailable) * 100) / 100;
  return { indexValue, coverageRatio, contributions };
}

export function assessVcciSnapshotQuality(input: {
  methodologyVersion: string;
  weights: VcciWeightMap;
  componentIndexes: Partial<Record<VcciComponentKey, number | null | undefined>>;
  sourceDatasets?: Array<{ component?: string; name?: string; category?: string }> | null;
  calculationDate: Date | string;
  explicitlyPublished?: boolean;
  now?: Date;
}): VcciQualityAssessment {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const now = input.now ?? new Date();

  if (input.methodologyVersion !== VCCI_METHODOLOGY_VERSION) {
    warnings.push(
      `Snapshot methodology ${input.methodologyVersion} differs from active framework ${VCCI_METHODOLOGY_VERSION}.`,
    );
  }

  const weightSum = sumVcciWeights(input.weights);
  if (Math.abs(weightSum - 1) > VCCI_WEIGHT_SUM_TOLERANCE) {
    blockers.push(
      `Component weights must sum to 1.0 (±${VCCI_WEIGHT_SUM_TOLERANCE}); found ${weightSum.toFixed(4)}.`,
    );
  }

  const { indexValue, coverageRatio, contributions } = computeVcciCompositeIndex({
    weights: input.weights,
    componentIndexes: input.componentIndexes,
  });

  const availableComponentCount = contributions.filter((c) => c.available).length;
  if (coverageRatio < VCCI_MIN_COMPONENT_COVERAGE) {
    blockers.push(
      `Weighted component coverage ${(coverageRatio * 100).toFixed(0)}% is below the ${VCCI_MIN_COMPONENT_COVERAGE * 100}% publish threshold.`,
    );
  }
  if (indexValue == null) {
    blockers.push('Composite index could not be computed from available component series.');
  }

  const calcDate = new Date(input.calculationDate);
  if (Number.isNaN(calcDate.getTime())) {
    blockers.push('Calculation date is missing or invalid.');
  } else {
    const ageDays = Math.floor((now.getTime() - calcDate.getTime()) / (24 * 60 * 60 * 1000));
    if (ageDays > VCCI_CURRENT_MAX_AGE_DAYS) {
      blockers.push(
        `Snapshot calculation date is ${ageDays} days old (max ${VCCI_CURRENT_MAX_AGE_DAYS} for public “current” display).`,
      );
    }
  }

  const sources = input.sourceDatasets ?? [];
  if (sources.length < Math.ceil(VCCI_COMPONENTS.length * VCCI_MIN_COMPONENT_COVERAGE)) {
    blockers.push('Insufficient documented source datasets for the covered components.');
  }

  if (input.explicitlyPublished === false) {
    blockers.push('Snapshot is not marked published.');
  }

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
    coverageRatio,
    weightSum,
    componentCount: VCCI_COMPONENTS.length,
    availableComponentCount,
  };
}

/** Public index pages may render numeric values only when this returns true. */
export function canPublishVcciPublicly(input: {
  hasActiveMethodology: boolean;
  quality: VcciQualityAssessment;
}): boolean {
  return input.hasActiveMethodology && input.quality.passed;
}

export function shouldShowVcciHistoryChart(pointCount: number): boolean {
  return pointCount >= VCCI_HISTORY_CHART_MIN_POINTS;
}

export const VCCI_METHODOLOGY_SECTIONS = [
  {
    id: 'overview',
    heading: 'What VCCI measures',
    body: `${VCCI_NAME} (${VCCI_SHORT_NAME}) tracks relative movement in a fixed basket of construction cost components versus a published baseline. Index level ${VCCI_BASELINE.indexLevel} equals the baseline period average. VCCI supports national/overall, city and component views only when underlying data quality clears the publication gate — Varnarc does not invent or publish arbitrary index values.`,
  },
  {
    id: 'baseline',
    heading: 'Baseline',
    body: `The current baseline is ${VCCI_BASELINE.label} (${VCCI_BASELINE.start} to ${VCCI_BASELINE.end}). During the baseline window, each component series is normalised so the basket composite equals ${VCCI_BASELINE.indexLevel}. Later periods are expressed relative to that baseline. Changing the baseline requires a new methodology version and a clear revision note.`,
  },
  {
    id: 'weights',
    heading: 'Component weights',
    body: `Default weights (methodology ${VCCI_METHODOLOGY_VERSION}): Cement ${(0.14 * 100).toFixed(0)}%, Steel ${(0.16 * 100).toFixed(0)}%, Aggregates ${(0.08 * 100).toFixed(0)}%, Masonry ${(0.1 * 100).toFixed(0)}%, Labour ${(0.25 * 100).toFixed(0)}%, Finishing ${(0.12 * 100).toFixed(0)}%, Electrical ${(0.08 * 100).toFixed(0)}%, Plumbing ${(0.07 * 100).toFixed(0)}%. Weights sum to 100%. City views may use the same national weights unless a city-specific weight set is published under a new methodology version. Missing components are excluded from the composite denominator — they are never silently assumed to be 100.`,
  },
  {
    id: 'data-sources',
    heading: 'Data sources',
    body: 'Component series draw from Varnarc construction material price observations (with freshness labels), construction cost-rate records for labour, and documented editorial baskets for electrical/plumbing where market-standard SKUs are sparse. Each published snapshot stores the source dataset list used for that calculation date. Stale or estimated prices are not treated as current inputs without explicit methodology notes.',
  },
  {
    id: 'calculation',
    heading: 'Calculation',
    body: 'For each component, an index is formed as (current reference level ÷ baseline reference level) × 100. The overall VCCI is the coverage-adjusted weighted average of available component indexes. We do not interpolate missing days into false daily precision; charts plot observation/calculation dates only.',
  },
  {
    id: 'update-frequency',
    heading: 'Update frequency',
    body: VCCI_UPDATE_FREQUENCY,
  },
  {
    id: 'publication-gate',
    heading: 'Publication gate',
    body: `Numeric VCCI values are exposed publicly only when: (1) an active methodology version is in force; (2) component weights are valid; (3) weighted coverage of available components is at least ${VCCI_MIN_COMPONENT_COVERAGE * 100}%; (4) source datasets are documented; (5) the snapshot calculation date is within ${VCCI_CURRENT_MAX_AGE_DAYS} days for “current” display; and (6) the snapshot is explicitly marked published. Until then, only the methodology and framework status are shown.`,
  },
  {
    id: 'limitations',
    heading: 'Limitations',
    body: `${VCCI_QUALIFICATION} Brand, grade, GST, logistics, productivity and contract form can move real project costs away from the index. City coverage is partial. Electrical and plumbing baskets are indicative. VCCI is not suitable as a sole basis for tenders, bank sanctions or dispute valuation.`,
  },
] as const;
