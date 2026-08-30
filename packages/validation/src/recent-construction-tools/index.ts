/**
 * Recently used construction tools — labels, brief result summaries, limits.
 * Guest persistence lives in the web app (localStorage); logged-in uses UserActivity.
 */

export const RECENT_CONSTRUCTION_TOOLS_LIMIT = 8;
export const RECENT_CONSTRUCTION_TOOLS_STORAGE_KEY = 'varnarc.construction.recent-tools.v1';

const TOOL_LABELS: Record<string, string> = {
  'cost-calculator': 'Construction Cost Calculator',
  'cement-calculator': 'Cement Calculator',
  'steel-calculator': 'Steel Calculator',
  'concrete-calculator': 'Concrete Calculator',
  'brick-calculator': 'Brick Calculator',
  'sand-calculator': 'Sand Calculator',
  'aggregate-calculator': 'Aggregate Calculator',
  'plaster-calculator': 'Plaster Calculator',
  'paint-calculator': 'Paint Calculator',
  'tile-calculator': 'Tile Calculator',
  'aac-block-calculator': 'AAC Block Calculator',
  'flooring-calculator': 'Flooring Calculator',
  'rcc-calculator': 'RCC Calculator',
  'slab-calculator': 'Slab Calculator',
  'beam-calculator': 'Beam Calculator',
  'column-calculator': 'Column Calculator',
  'footing-calculator': 'Footing Calculator',
  'bbs-calculator': 'Bar Bending Schedule',
  'boq-generator': 'BOQ Generator',
  'renovation-cost-calculator': 'Renovation Cost Calculator',
  'affordability-calculator': 'Affordability Calculator',
  'scenario-compare': 'Scenario Compare',
  'cost-optimization': 'Cost Optimization',
  'cost-change-simulator': 'Cost Change Simulator',
};

export function constructionToolLabel(calculatorSlug: string): string {
  if (TOOL_LABELS[calculatorSlug]) return TOOL_LABELS[calculatorSlug];
  return calculatorSlug
    .replace(/-calculator$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function constructionToolHref(calculatorSlug: string, sourcePath?: string | null): string {
  if (sourcePath && sourcePath.startsWith('/construction/')) return sourcePath;
  return `/construction/${calculatorSlug}`;
}

function formatInrBrief(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (n >= 100_000) {
    const lakhs = n / 100_000;
    return `≈ ₹${lakhs >= 10 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  return `≈ ₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/**
 * Build a short, non-sensitive result line from calculator outputs / unitSummary.
 * Never includes form inputs, addresses, or personal details.
 */
export function buildConstructionToolResultSummary(input: {
  outputs?: unknown;
  unitSummary?: unknown;
}): string | null {
  const bag = asNumber(
    (input.unitSummary as { bags?: unknown } | null)?.bags ??
      (input.outputs as { bags?: unknown } | null)?.bags,
  );
  if (bag != null) return `≈ ${Math.round(bag)} bags`;

  const cementKg = asNumber(
    (input.unitSummary as { cementKg?: unknown } | null)?.cementKg ??
      (input.outputs as { cementKg?: unknown } | null)?.cementKg,
  );
  if (cementKg != null) return `≈ ${Math.round(cementKg)} kg cement`;

  const steelKg = asNumber(
    (input.unitSummary as { totalWeightKg?: unknown } | null)?.totalWeightKg ??
      (input.outputs as { totalWeightKg?: unknown; weightKg?: unknown } | null)?.totalWeightKg ??
      (input.outputs as { weightKg?: unknown } | null)?.weightKg,
  );
  if (steelKg != null) return `≈ ${Math.round(steelKg)} kg steel`;

  const volumeM3 = asNumber(
    (input.unitSummary as { volumeM3?: unknown } | null)?.volumeM3 ??
      (input.outputs as { volumeM3?: unknown; wetVolumeM3?: unknown } | null)?.volumeM3 ??
      (input.outputs as { wetVolumeM3?: unknown } | null)?.wetVolumeM3,
  );
  if (volumeM3 != null) return `≈ ${volumeM3.toFixed(2)} m³`;

  const tiles = asNumber(
    (input.unitSummary as { tiles?: unknown; tileCount?: unknown } | null)?.tiles ??
      (input.unitSummary as { tileCount?: unknown } | null)?.tileCount ??
      (input.outputs as { tiles?: unknown; tileCount?: unknown } | null)?.tiles ??
      (input.outputs as { tileCount?: unknown } | null)?.tileCount,
  );
  if (tiles != null) return `≈ ${Math.round(tiles)} tiles`;

  const bricks = asNumber(
    (input.unitSummary as { bricks?: unknown } | null)?.bricks ??
      (input.outputs as { bricks?: unknown; brickCount?: unknown } | null)?.bricks ??
      (input.outputs as { brickCount?: unknown } | null)?.brickCount,
  );
  if (bricks != null) return `≈ ${Math.round(bricks)} bricks`;

  const paintLitres = asNumber(
    (input.unitSummary as { litres?: unknown; paintLitres?: unknown } | null)?.litres ??
      (input.unitSummary as { paintLitres?: unknown } | null)?.paintLitres ??
      (input.outputs as { litres?: unknown; paintLitres?: unknown } | null)?.litres ??
      (input.outputs as { paintLitres?: unknown } | null)?.paintLitres,
  );
  if (paintLitres != null) return `≈ ${paintLitres.toFixed(1)} L paint`;

  const total =
    asNumber((input.outputs as { totalCostInr?: unknown } | null)?.totalCostInr) ??
    asNumber((input.outputs as { totalCost?: unknown } | null)?.totalCost) ??
    asNumber((input.outputs as { estimatedCostInr?: unknown } | null)?.estimatedCostInr) ??
    asNumber((input.unitSummary as { totalCostInr?: unknown } | null)?.totalCostInr) ??
    asNumber((input.unitSummary as { estimatedCostInr?: unknown } | null)?.estimatedCostInr);

  if (total != null && total > 0) return formatInrBrief(total);

  return null;
}

export type RecentConstructionToolItem = {
  calculatorSlug: string;
  label: string;
  href: string;
  resultSummary: string | null;
  usedAt: number;
  /** Present when loaded from UserActivity for signed-in users. */
  activityId?: string;
};
