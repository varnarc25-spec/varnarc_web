/** Construction News Impact — structured news metadata + arithmetic project scenarios (no guarantees). */

import { z } from 'zod';
import {
  PRICE_HUB_MATERIALS,
  getPriceHubMaterial,
  isPriceHubMaterialKey,
  matchMaterialToHubKey,
  type PriceHubMaterialKey,
} from '../prices-hub';
import { calculateProjectPriceImpact } from '../material-price-position';

export const CONSTRUCTION_NEWS_IMPACT_VERSION = '2026.08.1';

export const CONSTRUCTION_NEWS_IMPACT_QUALIFICATION =
  'Scenario impact is arithmetic only (quantity × assumed unit-price change). A news article does not guarantee that market prices will move. Reported news, scenario assumptions, and calculated potential impact are shown separately.';

export const CONSTRUCTION_NEWS_IMPACT_METHODOLOGY =
  'Editors tag a Varnarc article with affected materials and optional illustrative unit-price deltas (scenario assumptions). For a saved project we look up matching material quantities. If quantity is missing, we do not invent an impact. When quantity exists: delta ≈ quantity × assumed ₹/unit change.';

/** Materials commonly tagged on construction/material news. */
export const NEWS_IMPACT_MATERIAL_KEYS = [
  'cement',
  'steel',
  'sand',
  'paint',
  'aggregate',
  'brick',
  'tiles',
] as const;

export type NewsImpactMaterialKey = (typeof NEWS_IMPACT_MATERIAL_KEYS)[number];

export function isNewsImpactMaterialKey(value: string): value is NewsImpactMaterialKey {
  return (NEWS_IMPACT_MATERIAL_KEYS as readonly string[]).includes(value);
}

export const newsImpactUnitSchema = z.enum(['bag', 'kg', 'tonne', 'm3', 'm2', 'litre', 'piece']);

export type NewsImpactUnit = z.infer<typeof newsImpactUnitSchema>;

/** Default unit for scenario deltas (must match how project qty is stored when possible). */
export const NEWS_IMPACT_DEFAULT_UNIT: Record<NewsImpactMaterialKey, NewsImpactUnit> = {
  cement: 'bag',
  steel: 'kg',
  sand: 'm3',
  paint: 'litre',
  aggregate: 'm3',
  brick: 'piece',
  tiles: 'm2',
};

export const newsAffectedMaterialSchema = z.object({
  materialKey: z.string().min(1),
  /** Optional illustrative Δ₹ per unit — scenario assumption, not a forecast. */
  assumedUnitChangeInr: z.number().finite().optional().nullable(),
  unit: newsImpactUnitSchema.optional().nullable(),
  note: z.string().max(280).optional().nullable(),
});

/**
 * Structured article metadata for construction news impact.
 * Stored under Article.metadata.constructionNewsImpact (or equivalent).
 */
export const constructionNewsImpactMetaSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  vertical: z.literal('construction').default('construction'),
  /** Reported news — factual article linkage only. */
  reportedNews: z.object({
    articleSlug: z.string().min(1).max(200),
    articleTitle: z.string().min(1).max(300),
    articlePath: z.string().min(1).max(300),
    publishedAt: z.string().datetime().optional().nullable(),
    summary: z.string().max(600).optional().nullable(),
  }),
  affectedMaterials: z.array(newsAffectedMaterialSchema).min(1).max(20),
  /** Explicit disclaimer stored with the news tag. */
  doesNotGuaranteePriceMove: z.literal(true).default(true),
});

export type ConstructionNewsImpactMeta = z.infer<typeof constructionNewsImpactMetaSchema>;
export type NewsAffectedMaterial = z.infer<typeof newsAffectedMaterialSchema>;

/** Layer 1 — reported news (no math). */
export type ReportedNewsLayer = {
  kind: 'reported_news';
  articleSlug: string;
  articleTitle: string;
  articleHref: string;
  publishedAt: string | null;
  summary: string | null;
  affectedMaterialKeys: NewsImpactMaterialKey[];
  materialPageHrefs: Array<{ materialKey: NewsImpactMaterialKey; href: string; label: string }>;
};

/** Layer 2 — scenario assumption (editor or user illustrative Δ). */
export type ScenarioAssumptionLayer = {
  kind: 'scenario_assumption';
  materialKey: NewsImpactMaterialKey;
  assumedUnitChangeInr: number;
  unit: NewsImpactUnit;
  label: string;
  disclaimer: string;
};

/** Layer 3 — calculated potential project impact (arithmetic only). */
export type CalculatedProjectImpactLayer =
  | {
      kind: 'calculated_potential_impact';
      status: 'unavailable';
      reason: string;
      materialKey: NewsImpactMaterialKey;
    }
  | {
      kind: 'calculated_potential_impact';
      status: 'ok';
      materialKey: NewsImpactMaterialKey;
      quantity: number;
      quantityUnit: string;
      assumedUnitChangeInr: number;
      estimatedCostDeltaInr: number;
      copy: string;
      disclaimer: string;
    };

export type ConstructionNewsImpactBundle = {
  reportedNews: ReportedNewsLayer;
  scenarios: ScenarioAssumptionLayer[];
  projectImpacts: CalculatedProjectImpactLayer[];
  qualification: string;
  methodology: string;
  version: string;
};

export type ProjectMaterialRequirement = {
  /** Free-text or hub key. */
  nameOrKey: string;
  quantity: number;
  unit: string;
  source?: 'project_item' | 'boq_item' | 'manual';
};

export const buildNewsImpactInputSchema = z.object({
  meta: constructionNewsImpactMetaSchema,
  projectRequirements: z.array(
    z.object({
      nameOrKey: z.string().min(1),
      quantity: z.number(),
      unit: z.string().min(1).max(40),
      source: z.enum(['project_item', 'boq_item', 'manual']).optional(),
    }),
  ),
});

export type BuildNewsImpactInput = z.infer<typeof buildNewsImpactInputSchema>;

function materialPageHref(key: NewsImpactMaterialKey): string {
  return `/construction/materials/${key}`;
}

function materialLabel(key: NewsImpactMaterialKey): string {
  return getPriceHubMaterial(key)?.label ?? key;
}

function normalizeUnit(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '');
}

/** Soft unit compatibility for matching project lines to scenario units. */
export function unitsLikelyCompatible(a: string, b: string): boolean {
  const na = normalizeUnit(a);
  const nb = normalizeUnit(b);
  if (na === nb) return true;
  const aliases: Record<string, string[]> = {
    bag: ['bag', 'bags', '50kgbag'],
    kg: ['kg', 'kgs', 'kilogram', 'kilograms'],
    tonne: ['tonne', 'ton', 'mt', 't'],
    m3: ['m3', 'm³', 'cum', 'cu.m', 'cubicmetre'],
    m2: ['m2', 'm²', 'sqm', 'sq.m', 'sqft', 'sft'],
    litre: ['litre', 'liter', 'l', 'ltr'],
    piece: ['piece', 'pc', 'pcs', 'nos', 'no', 'brick', 'block'],
  };
  for (const group of Object.values(aliases)) {
    if (group.includes(na) && group.includes(nb)) return true;
  }
  return false;
}

export function resolveNewsMaterialKey(raw: string): NewsImpactMaterialKey | null {
  if (isNewsImpactMaterialKey(raw)) return raw;
  const hub = matchMaterialToHubKey(raw);
  if (hub && isNewsImpactMaterialKey(hub)) return hub;
  return null;
}

export function parseConstructionNewsImpactMeta(raw: unknown): ConstructionNewsImpactMeta | null {
  const nested =
    raw && typeof raw === 'object' && 'constructionNewsImpact' in (raw as object)
      ? (raw as { constructionNewsImpact: unknown }).constructionNewsImpact
      : raw;
  const parsed = constructionNewsImpactMetaSchema.safeParse(nested);
  return parsed.success ? parsed.data : null;
}

export function buildReportedNewsLayer(meta: ConstructionNewsImpactMeta): ReportedNewsLayer {
  const keys = meta.affectedMaterials
    .map((m) => resolveNewsMaterialKey(m.materialKey))
    .filter((k): k is NewsImpactMaterialKey => k != null);
  const unique = [...new Set(keys)];
  return {
    kind: 'reported_news',
    articleSlug: meta.reportedNews.articleSlug,
    articleTitle: meta.reportedNews.articleTitle,
    articleHref: meta.reportedNews.articlePath.startsWith('/')
      ? meta.reportedNews.articlePath
      : `/articles/${meta.reportedNews.articleSlug}`,
    publishedAt: meta.reportedNews.publishedAt ?? null,
    summary: meta.reportedNews.summary ?? null,
    affectedMaterialKeys: unique,
    materialPageHrefs: unique.map((materialKey) => ({
      materialKey,
      href: materialPageHref(materialKey),
      label: materialLabel(materialKey),
    })),
  };
}

export function buildScenarioAssumptions(
  meta: ConstructionNewsImpactMeta,
): ScenarioAssumptionLayer[] {
  const out: ScenarioAssumptionLayer[] = [];
  for (const row of meta.affectedMaterials) {
    const key = resolveNewsMaterialKey(row.materialKey);
    if (!key) continue;
    if (row.assumedUnitChangeInr == null || !Number.isFinite(row.assumedUnitChangeInr)) continue;
    if (row.assumedUnitChangeInr === 0) continue;
    const unit = row.unit ?? NEWS_IMPACT_DEFAULT_UNIT[key];
    const abs = Math.abs(row.assumedUnitChangeInr);
    const direction = row.assumedUnitChangeInr > 0 ? 'increases' : 'decreases';
    out.push({
      kind: 'scenario_assumption',
      materialKey: key,
      assumedUnitChangeInr: row.assumedUnitChangeInr,
      unit,
      label: `If ${materialLabel(key).toLowerCase()} ${direction} ₹${abs.toLocaleString('en-IN')} per ${unit}`,
      disclaimer:
        'Scenario assumption only — the article does not guarantee this price movement will occur.',
    });
  }
  return out;
}

function findRequirementForMaterial(
  materialKey: NewsImpactMaterialKey,
  requirements: ProjectMaterialRequirement[],
  expectedUnit: NewsImpactUnit,
): ProjectMaterialRequirement | null {
  const matches = requirements.filter((r) => {
    if (!(r.quantity > 0) || !Number.isFinite(r.quantity)) return false;
    const key = resolveNewsMaterialKey(r.nameOrKey) ?? matchMaterialToHubKey(r.nameOrKey);
    return key === materialKey;
  });
  if (matches.length === 0) return null;
  const unitOk = matches.find((m) => unitsLikelyCompatible(m.unit, expectedUnit));
  return unitOk ?? null;
}

/**
 * Layer 3: arithmetic impact. Returns unavailable when project quantity is missing
 * or units cannot be reconciled — never invents quantities.
 */
export function calculateNewsProjectImpacts(input: {
  scenarios: ScenarioAssumptionLayer[];
  projectRequirements: ProjectMaterialRequirement[];
}): CalculatedProjectImpactLayer[] {
  return input.scenarios.map((scenario) => {
    const req = findRequirementForMaterial(
      scenario.materialKey,
      input.projectRequirements,
      scenario.unit,
    );
    if (!req) {
      const hasMaterial = input.projectRequirements.some((r) => {
        const key = resolveNewsMaterialKey(r.nameOrKey) ?? matchMaterialToHubKey(r.nameOrKey);
        return key === scenario.materialKey && r.quantity > 0;
      });
      return {
        kind: 'calculated_potential_impact' as const,
        status: 'unavailable' as const,
        materialKey: scenario.materialKey,
        reason: hasMaterial
          ? `Project has ${materialLabel(scenario.materialKey)} quantity, but its unit does not match the scenario unit (${scenario.unit}). Impact not calculated.`
          : `No saved project quantity for ${materialLabel(scenario.materialKey)}. Impact not calculated.`,
      };
    }

    const impact = calculateProjectPriceImpact({
      quantity: req.quantity,
      quantityUnit: req.unit,
      unitChangeInr: Math.abs(scenario.assumedUnitChangeInr),
    });

    const verb = scenario.assumedUnitChangeInr >= 0 ? 'increase' : 'decrease';
    const copy = `If ${materialLabel(scenario.materialKey).toLowerCase()} ${
      scenario.assumedUnitChangeInr >= 0 ? 'increases' : 'decreases'
    } ₹${Math.abs(scenario.assumedUnitChangeInr).toLocaleString('en-IN')} per ${scenario.unit}, your project's estimated ${materialLabel(scenario.materialKey).toLowerCase()} cost would ${verb} by approximately ₹${impact.estimatedCostDeltaInr.toLocaleString('en-IN')}.`;

    return {
      kind: 'calculated_potential_impact' as const,
      status: 'ok' as const,
      materialKey: scenario.materialKey,
      quantity: req.quantity,
      quantityUnit: req.unit,
      assumedUnitChangeInr: scenario.assumedUnitChangeInr,
      estimatedCostDeltaInr: impact.estimatedCostDeltaInr,
      copy,
      disclaimer:
        'Potential impact under the stated scenario assumption only. News does not guarantee the price change.',
    };
  });
}

/**
 * Build the full three-layer news impact bundle for UI / API.
 */
export function buildConstructionNewsImpact(
  raw: BuildNewsImpactInput,
): ConstructionNewsImpactBundle {
  const input = buildNewsImpactInputSchema.parse(raw);
  const reportedNews = buildReportedNewsLayer(input.meta);
  const scenarios = buildScenarioAssumptions(input.meta);
  const projectImpacts = calculateNewsProjectImpacts({
    scenarios,
    projectRequirements: input.projectRequirements,
  });

  return {
    reportedNews,
    scenarios,
    projectImpacts,
    qualification: CONSTRUCTION_NEWS_IMPACT_QUALIFICATION,
    methodology: CONSTRUCTION_NEWS_IMPACT_METHODOLOGY,
    version: CONSTRUCTION_NEWS_IMPACT_VERSION,
  };
}

export function listNewsImpactMaterials() {
  return NEWS_IMPACT_MATERIAL_KEYS.map((key) => {
    const hub = PRICE_HUB_MATERIALS.find((m) => m.key === key);
    return {
      key,
      label: hub?.label ?? key,
      unitHint: hub?.unitHint ?? `₹ / ${NEWS_IMPACT_DEFAULT_UNIT[key]}`,
      defaultUnit: NEWS_IMPACT_DEFAULT_UNIT[key],
      materialHref: materialPageHref(key),
      isPriceHubKey: isPriceHubMaterialKey(key),
    };
  });
}

/** Example cement scenario copy (for docs/tests) — arithmetic only. */
export function formatCementBagScenarioCopy(input: { bagDeltaInr: number; bags: number }): string {
  const delta = Math.round(input.bags * Math.abs(input.bagDeltaInr));
  const verb = input.bagDeltaInr >= 0 ? 'increase' : 'decrease';
  return `If cement ${input.bagDeltaInr >= 0 ? 'increases' : 'decreases'} ₹${Math.abs(input.bagDeltaInr).toLocaleString('en-IN')} per bag, your project's estimated cement cost would ${verb} by approximately ₹${delta.toLocaleString('en-IN')}.`;
}
