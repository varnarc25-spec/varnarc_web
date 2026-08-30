/**
 * Construction search opportunity — privacy-safe normalize, intent, opportunity rules.
 * Hashing is done server-side (Node crypto) — do not import hash helpers in the browser.
 */

import { z } from 'zod';

export const CONSTRUCTION_SEARCH_INTENTS = [
  'calculator',
  'guide',
  'material',
  'cost',
  'price',
  'boq',
  'contractor',
  'general',
] as const;

export type ConstructionSearchIntent = (typeof CONSTRUCTION_SEARCH_INTENTS)[number];

export const CONSTRUCTION_SEARCH_OPPORTUNITY_TYPES = [
  'high_search_no_result',
  'high_search_low_ctr',
  'emerging_calculator_intent',
  'emerging_guide_intent',
  'emerging_material_intent',
  'emerging_cost_intent',
] as const;

export type ConstructionSearchOpportunityType =
  (typeof CONSTRUCTION_SEARCH_OPPORTUNITY_TYPES)[number];

export const CONSTRUCTION_SEARCH_OPPORTUNITY_STATUSES = [
  'OPEN',
  'PLANNED',
  'IMPLEMENTED',
  'IGNORED',
] as const;

export const logConstructionSearchEventSchema = z.object({
  query: z.string().min(1).max(200),
  surface: z.string().min(1).max(40).default('construction'),
  resultCount: z.number().int().min(0).max(10_000),
  clicked: z.boolean().optional().default(false),
  path: z.string().max(200).optional(),
});

export const markConstructionSearchClickSchema = z.object({
  query: z.string().min(1).max(200),
  surface: z.string().min(1).max(40).optional(),
});

export const constructionSearchOpportunityListQuerySchema = z.object({
  windowDays: z.coerce
    .number()
    .int()
    .refine((n) => [7, 30, 90].includes(n))
    .default(30),
  status: z.enum(['OPEN', 'PLANNED', 'IMPLEMENTED', 'IGNORED', 'all']).optional().default('all'),
  opportunityType: z.string().optional(),
  intent: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  cursor: z.string().uuid().optional(),
});

export const updateConstructionSearchOpportunitySchema = z.object({
  status: z.enum(['OPEN', 'PLANNED', 'IMPLEMENTED', 'IGNORED']),
  notes: z.string().max(2000).optional().nullable(),
});

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const LONG_NUMBER_RE = /\b\d{8,}\b/g;

/** Scrub PII-like tokens and normalize for hashing/display. */
export function normalizeConstructionSearchQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(EMAIL_RE, ' ')
    .replace(PHONE_RE, ' ')
    .replace(LONG_NUMBER_RE, ' ')
    .replace(/[^\p{L}\p{N}\s+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export function detectConstructionSearchIntent(normalized: string): ConstructionSearchIntent {
  const q = normalized;
  if (/\b(calculator|calc|estimate|estimator|bbs|boq generator)\b/.test(q)) return 'calculator';
  if (/\b(guide|how to|checklist|tips|steps)\b/.test(q)) return 'guide';
  if (/\b(cement|steel|sand|aggregate|brick|aac|paint|tile|concrete|plaster|waterproof)/.test(q))
    return 'material';
  if (/\b(cost|budget|price per|rate)\b/.test(q)) return 'cost';
  if (/\b(price|rate today|market rate)\b/.test(q)) return 'price';
  if (/\b(boq|bill of quantities|quantity)\b/.test(q)) return 'boq';
  if (/\b(contractor|labour|labor|mason|plumber)\b/.test(q)) return 'contractor';
  return 'general';
}

export type ConstructionSearchAggregateRow = {
  queryHash: string;
  displayQuery: string;
  intent: ConstructionSearchIntent | string;
  searchCount: number;
  zeroResultCount: number;
  clickCount: number;
  avgResultCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type DetectedConstructionOpportunity = {
  queryHash: string;
  displayQuery: string;
  intent: string;
  opportunityType: ConstructionSearchOpportunityType;
  searchCount: number;
  zeroResultCount: number;
  clickCount: number;
  avgResultCount: number;
  ctr: number;
  zeroResultRate: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  evidence: Record<string, unknown>;
};

const HIGH_SEARCH_MIN = {
  7: 15,
  30: 40,
  90: 80,
} as const;

const EMERGING_MIN = {
  7: 8,
  30: 20,
  90: 40,
} as const;

const LOW_CTR = 0.08;

export function detectConstructionSearchOpportunities(
  rows: ConstructionSearchAggregateRow[],
  windowDays: 7 | 30 | 90,
): DetectedConstructionOpportunity[] {
  const highMin = HIGH_SEARCH_MIN[windowDays];
  const emergingMin = EMERGING_MIN[windowDays];
  const out: DetectedConstructionOpportunity[] = [];

  for (const row of rows) {
    if (row.searchCount < emergingMin) continue;
    const ctr = row.searchCount > 0 ? row.clickCount / row.searchCount : 0;
    const zeroResultRate = row.searchCount > 0 ? row.zeroResultCount / row.searchCount : 0;
    const base = {
      queryHash: row.queryHash,
      displayQuery: row.displayQuery,
      intent: row.intent,
      searchCount: row.searchCount,
      zeroResultCount: row.zeroResultCount,
      clickCount: row.clickCount,
      avgResultCount: row.avgResultCount,
      ctr,
      zeroResultRate,
      firstSeenAt: row.firstSeenAt,
      lastSeenAt: row.lastSeenAt,
    };

    if (row.searchCount >= highMin && zeroResultRate >= 0.7) {
      out.push({
        ...base,
        opportunityType: 'high_search_no_result',
        evidence: {
          summary: `${row.searchCount.toLocaleString('en-IN')} searches · No dedicated result`,
          recommendation:
            'Potential feature/content opportunity — consider a dedicated calculator, guide, or material page.',
        },
      });
      continue;
    }

    if (row.searchCount >= highMin && ctr < LOW_CTR && row.avgResultCount > 0) {
      out.push({
        ...base,
        opportunityType: 'high_search_low_ctr',
        evidence: {
          summary: `${row.searchCount.toLocaleString('en-IN')} searches · Low CTR (${(ctr * 100).toFixed(1)}%)`,
          recommendation: 'Improve ranking, titles, or result relevance for this query intent.',
        },
      });
      continue;
    }

    if (row.intent === 'calculator' && row.searchCount >= emergingMin) {
      out.push({
        ...base,
        opportunityType: 'emerging_calculator_intent',
        evidence: {
          summary: `Emerging calculator intent · ${row.searchCount.toLocaleString('en-IN')} searches`,
          recommendation: 'Evaluate a dedicated calculator landing or FAQ for this query.',
        },
      });
      continue;
    }

    if (row.intent === 'guide' && row.searchCount >= emergingMin) {
      out.push({
        ...base,
        opportunityType: 'emerging_guide_intent',
        evidence: {
          summary: `Emerging guide intent · ${row.searchCount.toLocaleString('en-IN')} searches`,
          recommendation: 'Consider a how-to guide or checklist covering this topic.',
        },
      });
      continue;
    }

    if (row.intent === 'material' && row.searchCount >= emergingMin) {
      out.push({
        ...base,
        opportunityType: 'emerging_material_intent',
        evidence: {
          summary: `Emerging material intent · ${row.searchCount.toLocaleString('en-IN')} searches`,
          recommendation: 'Check material catalog coverage, synonyms, and price landings.',
        },
      });
      continue;
    }

    if ((row.intent === 'cost' || row.intent === 'price') && row.searchCount >= emergingMin) {
      out.push({
        ...base,
        opportunityType: 'emerging_cost_intent',
        evidence: {
          summary: `Emerging cost/price intent · ${row.searchCount.toLocaleString('en-IN')} searches`,
          recommendation: 'Consider cost calculator coverage or city price pages for this topic.',
        },
      });
    }
  }

  return out.sort((a, b) => b.searchCount - a.searchCount);
}

export const OPPORTUNITY_TYPE_LABELS: Record<ConstructionSearchOpportunityType, string> = {
  high_search_no_result: 'High searches · no result',
  high_search_low_ctr: 'High searches · low CTR',
  emerging_calculator_intent: 'Emerging calculator intent',
  emerging_guide_intent: 'Emerging guide intent',
  emerging_material_intent: 'Emerging material intent',
  emerging_cost_intent: 'Emerging cost intent',
};
