/** Contractor Quote Analyzer — categories, CSV parse, normalize, compare (no market benchmarks). */

import { z } from 'zod';

export const CONTRACTOR_QUOTE_ANALYZER_VERSION = '2026.08.1';

export const CONTRACTOR_QUOTE_QUALIFICATION =
  'This tool compares contractor quotes you entered or uploaded. It does not rate contractors as good or bad, and it does not invent market benchmark prices. Missing items are flagged as missing — not assumed to be included elsewhere.';

export const CONTRACTOR_QUOTE_CATEGORIES = [
  { key: 'rcc', label: 'RCC' },
  { key: 'masonry', label: 'Masonry' },
  { key: 'plaster', label: 'Plaster' },
  { key: 'flooring', label: 'Flooring' },
  { key: 'painting', label: 'Painting' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'plumbing', label: 'Plumbing' },
  { key: 'doors_windows', label: 'Doors/windows' },
  { key: 'waterproofing', label: 'Waterproofing' },
  { key: 'labour', label: 'Labour' },
  { key: 'other', label: 'Other' },
] as const;

export type QuoteCategoryKey = (typeof CONTRACTOR_QUOTE_CATEGORIES)[number]['key'];

export const QUOTE_CATEGORY_KEYWORDS: Record<QuoteCategoryKey, string[]> = {
  rcc: ['rcc', 'reinforced', 'concrete', 'm20', 'm25', 'slab', 'beam', 'column', 'footing', 'raft'],
  masonry: ['masonry', 'brick', 'block', 'aac', 'wall work', 'brickwork'],
  plaster: ['plaster', 'plastering', 'skim', 'putty'],
  flooring: ['flooring', 'tile', 'vitrified', 'marble', 'granite', 'screed', 'floor'],
  painting: ['paint', 'painting', 'emulsion', 'primer', 'distemper'],
  electrical: ['electrical', 'wiring', 'switch', 'db ', 'mcb', 'conduit', 'light point'],
  plumbing: ['plumbing', 'pipe', 'cpvc', 'upvc', 'sanitary', 'drainage', 'water supply'],
  doors_windows: ['door', 'window', 'aluminium', 'upvc window', 'shutter', 'frame'],
  waterproofing: ['waterproof', 'waterproofing', 'terrace waterproof', 'membrane'],
  labour: ['labour', 'labor', 'manpower', 'wages', 'skilled labour', 'unskilled'],
  other: [],
};

/** Relative difference above this (e.g. 0.2 = 20%) is a “large difference”. */
export const QUOTE_LARGE_DIFF_RATIO = 0.2;
/** Absolute INR difference also qualifies as large when ratio is soft. */
export const QUOTE_LARGE_DIFF_ABSOLUTE = 25_000;
export const QUOTE_MAX_QUOTES = 3;
export const QUOTE_MAX_ITEMS_PER_QUOTE = 200;

export const quoteLineSchema = z.object({
  id: z.string().min(1),
  description: z.string().trim().min(1).max(500),
  category: z
    .enum([
      'rcc',
      'masonry',
      'plaster',
      'flooring',
      'painting',
      'electrical',
      'plumbing',
      'doors_windows',
      'waterproofing',
      'labour',
      'other',
    ])
    .default('other'),
  unit: z.string().trim().max(40).optional().nullable(),
  quantity: z.coerce.number().nonnegative().optional().nullable(),
  unitRate: z.coerce.number().nonnegative().optional().nullable(),
  amount: z.coerce.number().nonnegative().optional().nullable(),
  /** Manual match key shared across quotes when user maps unmatched items. */
  matchKey: z.string().trim().max(120).optional().nullable(),
});

export type QuoteLineInput = z.infer<typeof quoteLineSchema>;

export const contractorQuoteSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  contractorName: z.string().trim().max(120).optional().nullable(),
  currency: z.string().length(3).default('INR'),
  items: z.array(quoteLineSchema).max(QUOTE_MAX_ITEMS_PER_QUOTE),
});

export type ContractorQuoteInput = z.infer<typeof contractorQuoteSchema>;

export const analyzeContractorQuotesSchema = z.object({
  quotes: z.array(contractorQuoteSchema).min(1).max(QUOTE_MAX_QUOTES),
  /** Optional user mappings: { fromQuoteId, fromItemId, toQuoteId, toItemId } */
  mappings: z
    .array(
      z.object({
        fromQuoteId: z.string(),
        fromItemId: z.string(),
        toQuoteId: z.string(),
        toItemId: z.string(),
      }),
    )
    .max(500)
    .optional()
    .default([]),
  largeDiffRatio: z.coerce.number().positive().max(2).optional(),
  largeDiffAbsolute: z.coerce.number().positive().optional(),
});

export type AnalyzeContractorQuotesInput = z.infer<typeof analyzeContractorQuotesSchema>;

export type NormalizedQuoteLine = {
  id: string;
  description: string;
  category: QuoteCategoryKey;
  categoryLabel: string;
  unit: string | null;
  quantity: number | null;
  unitRate: number | null;
  amount: number;
  matchKey: string;
  autoCategorized: boolean;
};

export type NormalizedQuote = {
  id: string;
  label: string;
  contractorName: string | null;
  currency: string;
  items: NormalizedQuoteLine[];
  total: number;
  categoryTotals: Array<{ key: QuoteCategoryKey; label: string; amount: number }>;
};

export type MissingItemFlag = {
  type: 'missing_item';
  message: string;
  presentQuoteId: string;
  presentQuoteLabel: string;
  missingQuoteId: string;
  missingQuoteLabel: string;
  itemDescription: string;
  itemId: string;
  category: QuoteCategoryKey;
};

export type LargeDifferenceFlag = {
  type: 'large_difference';
  message: string;
  scope: 'total' | 'category' | 'item' | 'unit_rate';
  category?: QuoteCategoryKey;
  matchKey?: string;
  description?: string;
  values: Array<{ quoteId: string; quoteLabel: string; amount: number }>;
  ratio: number | null;
  absolute: number;
};

export type QuoteCompareResult = {
  version: string;
  qualification: string;
  quotes: NormalizedQuote[];
  quoteTotals: Array<{ quoteId: string; label: string; total: number }>;
  categoryMatrix: Array<{
    key: QuoteCategoryKey;
    label: string;
    amounts: Array<{ quoteId: string; label: string; amount: number; present: boolean }>;
  }>;
  missingCategories: Array<{
    quoteId: string;
    quoteLabel: string;
    category: QuoteCategoryKey;
    categoryLabel: string;
    message: string;
  }>;
  missingItems: MissingItemFlag[];
  largeDifferences: LargeDifferenceFlag[];
  unitRateDifferences: Array<{
    matchKey: string;
    description: string;
    unit: string | null;
    rates: Array<{ quoteId: string; quoteLabel: string; unitRate: number | null; amount: number }>;
    message: string;
  }>;
  unmatchedItems: Array<{
    quoteId: string;
    quoteLabel: string;
    itemId: string;
    description: string;
    category: QuoteCategoryKey;
  }>;
  /** Explicit: no invented benchmarks. */
  includesMarketBenchmarks: false;
};

function categoryLabel(key: QuoteCategoryKey): string {
  return CONTRACTOR_QUOTE_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function suggestQuoteCategory(description: string): {
  key: QuoteCategoryKey;
  autoCategorized: boolean;
} {
  const s = description.toLowerCase();
  for (const cat of CONTRACTOR_QUOTE_CATEGORIES) {
    if (cat.key === 'other') continue;
    const words = QUOTE_CATEGORY_KEYWORDS[cat.key];
    if (words.some((w) => s.includes(w))) {
      return { key: cat.key, autoCategorized: true };
    }
  }
  return { key: 'other', autoCategorized: false };
}

export function normalizeMatchKey(description: string, unit?: string | null): string {
  const base = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const u = (unit ?? '').toLowerCase().trim();
  return u ? `${base}|${u}` : base;
}

function lineAmount(line: QuoteLineInput): number {
  if (line.amount != null && Number.isFinite(line.amount))
    return Math.round(line.amount * 100) / 100;
  const q = line.quantity ?? 0;
  const r = line.unitRate ?? 0;
  return Math.round(q * r * 100) / 100;
}

export function normalizeQuoteLine(raw: QuoteLineInput): NormalizedQuoteLine {
  const line = quoteLineSchema.parse(raw);
  const suggested = suggestQuoteCategory(line.description);
  const explicit =
    raw.category != null &&
    CONTRACTOR_QUOTE_CATEGORIES.some((c) => c.key === raw.category) &&
    // Treat default zod 'other' as unset when description suggests something else
    !(raw.category === 'other' && suggested.autoCategorized && suggested.key !== 'other');

  const finalCategory: QuoteCategoryKey = explicit
    ? (raw.category as QuoteCategoryKey)
    : suggested.key;

  const matchKey = line.matchKey?.trim() || normalizeMatchKey(line.description, line.unit);
  return {
    id: line.id,
    description: line.description.trim(),
    category: finalCategory,
    categoryLabel: categoryLabel(finalCategory),
    unit: line.unit?.trim() || null,
    quantity: line.quantity ?? null,
    unitRate: line.unitRate ?? null,
    amount: lineAmount(line),
    matchKey,
    autoCategorized: !explicit && suggested.autoCategorized,
  };
}

export function normalizeQuote(raw: ContractorQuoteInput): NormalizedQuote {
  const q = contractorQuoteSchema.parse(raw);
  const items = q.items.map(normalizeQuoteLine);
  const total = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  const categoryTotals = CONTRACTOR_QUOTE_CATEGORIES.map((c) => {
    const amount =
      Math.round(
        items.filter((i) => i.category === c.key).reduce((s, i) => s + i.amount, 0) * 100,
      ) / 100;
    return { key: c.key, label: c.label, amount };
  });
  return {
    id: q.id,
    label: q.label.trim(),
    contractorName: q.contractorName?.trim() || null,
    currency: q.currency ?? 'INR',
    items,
    total,
    categoryTotals,
  };
}

/**
 * Minimal CSV parser for quote lines.
 * Expected headers (case-insensitive): description/item, category?, unit?, quantity/qty?, unitRate/rate?, amount/total?
 * Optional: quoteLabel to split multi-quote files (ignored when importing into a single quote slot).
 */
export function parseQuoteCsv(csvText: string): {
  rows: Array<{
    description: string;
    category: QuoteCategoryKey | null;
    unit: string | null;
    quantity: number | null;
    unitRate: number | null;
    amount: number | null;
  }>;
  warnings: string[];
} {
  const warnings: string[] = [];
  const text = csvText.replace(/^\uFEFF/, '').trim();
  if (!text) return { rows: [], warnings: ['Empty CSV.'] };

  const lines = splitCsvLines(text);
  if (lines.length < 2) {
    return { rows: [], warnings: ['CSV needs a header row and at least one data row.'] };
  }

  const headers = parseCsvRow(lines[0]!).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));

  const descI = idx(['description', 'item', 'particulars', 'particular', 'name', 'work']);
  if (descI < 0) {
    return {
      rows: [],
      warnings: [
        'Missing description/item column. Expected headers like description, item, or particulars.',
      ],
    };
  }
  const catI = idx(['category', 'cat']);
  const unitI = idx(['unit', 'uom']);
  const qtyI = idx(['quantity', 'qty', 'qty.', 'nos']);
  const rateI = idx(['unitrate', 'unit_rate', 'rate', 'unit rate', 'price']);
  const amtI = idx(['amount', 'total', 'value', 'line_total']);

  const rows: Array<{
    description: string;
    category: QuoteCategoryKey | null;
    unit: string | null;
    quantity: number | null;
    unitRate: number | null;
    amount: number | null;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]!);
    if (cols.every((c) => !c.trim())) continue;
    const description = (cols[descI] ?? '').trim();
    if (!description) continue;

    let category: QuoteCategoryKey | null = null;
    if (catI >= 0 && cols[catI]) {
      category = parseCategoryLabel(cols[catI]!);
    }

    const num = (v: string | undefined) => {
      if (v == null || !String(v).trim()) return null;
      const n = Number(String(v).replace(/,/g, '').replace(/₹/g, '').trim());
      return Number.isFinite(n) ? n : null;
    };

    rows.push({
      description,
      category,
      unit: unitI >= 0 ? cols[unitI]?.trim() || null : null,
      quantity: qtyI >= 0 ? num(cols[qtyI]) : null,
      unitRate: rateI >= 0 ? num(cols[rateI]) : null,
      amount: amtI >= 0 ? num(cols[amtI]) : null,
    });
  }

  if (!rows.length) warnings.push('No data rows parsed from CSV.');
  if (rows.length > QUOTE_MAX_ITEMS_PER_QUOTE) {
    warnings.push(`Truncated to ${QUOTE_MAX_ITEMS_PER_QUOTE} items.`);
    return { rows: rows.slice(0, QUOTE_MAX_ITEMS_PER_QUOTE), warnings };
  }
  return { rows, warnings };
}

function parseCategoryLabel(raw: string): QuoteCategoryKey | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[\s/-]+/g, '_');
  for (const c of CONTRACTOR_QUOTE_CATEGORIES) {
    if (c.key === s || c.label.toLowerCase() === raw.trim().toLowerCase()) return c.key;
  }
  if (s.includes('door') || s.includes('window')) return 'doors_windows';
  if (s.includes('labour') || s.includes('labor')) return 'labour';
  if (s.includes('rcc') || s.includes('concrete')) return 'rcc';
  return null;
}

function splitCsvLines(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (cur.trim()) out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function parseCsvRow(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  cols.push(cur);
  return cols;
}

function applyMappings(
  quotes: NormalizedQuote[],
  mappings: AnalyzeContractorQuotesInput['mappings'],
): NormalizedQuote[] {
  if (!mappings?.length) return quotes;
  const clone = quotes.map((q) => ({
    ...q,
    items: q.items.map((i) => ({ ...i })),
  }));
  for (const m of mappings) {
    const fromQ = clone.find((q) => q.id === m.fromQuoteId);
    const toQ = clone.find((q) => q.id === m.toQuoteId);
    const fromItem = fromQ?.items.find((i) => i.id === m.fromItemId);
    const toItem = toQ?.items.find((i) => i.id === m.toItemId);
    if (!fromItem || !toItem) continue;
    const key = `map:${fromItem.id}:${toItem.id}`;
    fromItem.matchKey = key;
    toItem.matchKey = key;
  }
  return clone;
}

/**
 * Compare up to 3 contractor quotes. Never invents market benchmarks or good/bad labels.
 */
export function analyzeContractorQuotes(raw: AnalyzeContractorQuotesInput): QuoteCompareResult {
  const input = analyzeContractorQuotesSchema.parse(raw);
  const ratioThreshold = input.largeDiffRatio ?? QUOTE_LARGE_DIFF_RATIO;
  const absThreshold = input.largeDiffAbsolute ?? QUOTE_LARGE_DIFF_ABSOLUTE;

  let quotes = input.quotes.map(normalizeQuote);
  quotes = applyMappings(quotes, input.mappings);

  const quoteTotals = quotes.map((q) => ({
    quoteId: q.id,
    label: q.label,
    total: q.total,
  }));

  const categoryMatrix = CONTRACTOR_QUOTE_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    amounts: quotes.map((q) => {
      const ct = q.categoryTotals.find((t) => t.key === c.key);
      const amount = ct?.amount ?? 0;
      const present = q.items.some((i) => i.category === c.key);
      return { quoteId: q.id, label: q.label, amount, present };
    }),
  }));

  const missingCategories: QuoteCompareResult['missingCategories'] = [];
  // A category is "present" in the comparison if any quote has it; flag quotes missing it.
  for (const row of categoryMatrix) {
    const anyPresent = row.amounts.some((a) => a.present);
    if (!anyPresent) continue;
    for (const a of row.amounts) {
      if (!a.present) {
        missingCategories.push({
          quoteId: a.quoteId,
          quoteLabel: a.label,
          category: row.key,
          categoryLabel: row.label,
          message: `Category “${row.label}” missing from ${a.label}`,
        });
      }
    }
  }

  // Item-level matching by matchKey across quotes
  const keys = new Set<string>();
  for (const q of quotes) for (const i of q.items) keys.add(i.matchKey);

  const missingItems: MissingItemFlag[] = [];
  const unmatchedItems: QuoteCompareResult['unmatchedItems'] = [];
  const unitRateDifferences: QuoteCompareResult['unitRateDifferences'] = [];
  const largeDifferences: LargeDifferenceFlag[] = [];

  for (const key of keys) {
    const present = quotes.map((q) => ({
      quote: q,
      item: q.items.find((i) => i.matchKey === key) ?? null,
    }));
    const withItem = present.filter((p) => p.item);
    if (withItem.length === 1 && quotes.length > 1) {
      const only = withItem[0]!;
      for (const p of present) {
        if (p.item) continue;
        missingItems.push({
          type: 'missing_item',
          message: `Item missing from ${p.quote.label}`,
          presentQuoteId: only.quote.id,
          presentQuoteLabel: only.quote.label,
          missingQuoteId: p.quote.id,
          missingQuoteLabel: p.quote.label,
          itemDescription: only.item!.description,
          itemId: only.item!.id,
          category: only.item!.category,
        });
        unmatchedItems.push({
          quoteId: only.quote.id,
          quoteLabel: only.quote.label,
          itemId: only.item!.id,
          description: only.item!.description,
          category: only.item!.category,
        });
      }
      continue;
    }

    if (withItem.length >= 2) {
      const amounts = withItem.map((p) => ({
        quoteId: p.quote.id,
        quoteLabel: p.quote.label,
        amount: p.item!.amount,
      }));
      const vals = amounts.map((a) => a.amount);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const absolute = max - min;
      const ratio = min > 0 ? absolute / min : null;
      if (absolute >= absThreshold || (ratio != null && ratio >= ratioThreshold)) {
        largeDifferences.push({
          type: 'large_difference',
          scope: 'item',
          matchKey: key,
          description: withItem[0]!.item!.description,
          category: withItem[0]!.item!.category,
          message: `Large difference on “${withItem[0]!.item!.description}” across quotes`,
          values: amounts,
          ratio,
          absolute,
        });
      }

      const rates = withItem.map((p) => ({
        quoteId: p.quote.id,
        quoteLabel: p.quote.label,
        unitRate: p.item!.unitRate,
        amount: p.item!.amount,
      }));
      const comparableRates = rates.filter((r) => r.unitRate != null && r.unitRate > 0);
      if (comparableRates.length >= 2) {
        const rVals = comparableRates.map((r) => r.unitRate!);
        const rMin = Math.min(...rVals);
        const rMax = Math.max(...rVals);
        const rAbs = rMax - rMin;
        const rRatio = rMin > 0 ? rAbs / rMin : null;
        if (
          rAbs > 0 &&
          (rRatio == null || rRatio >= ratioThreshold || rAbs >= absThreshold / 100)
        ) {
          unitRateDifferences.push({
            matchKey: key,
            description: withItem[0]!.item!.description,
            unit: withItem[0]!.item!.unit,
            rates,
            message: `Unit-rate difference on “${withItem[0]!.item!.description}” where comparable`,
          });
          largeDifferences.push({
            type: 'large_difference',
            scope: 'unit_rate',
            matchKey: key,
            description: withItem[0]!.item!.description,
            message: `Unit-rate difference on “${withItem[0]!.item!.description}”`,
            values: comparableRates.map((r) => ({
              quoteId: r.quoteId,
              quoteLabel: r.quoteLabel,
              amount: r.unitRate!,
            })),
            ratio: rRatio,
            absolute: rAbs,
          });
        }
      }
    }
  }

  // Category large diffs
  for (const row of categoryMatrix) {
    const presentAmounts = row.amounts.filter((a) => a.present);
    if (presentAmounts.length < 2) continue;
    const vals = presentAmounts.map((a) => a.amount);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const absolute = max - min;
    const ratio = min > 0 ? absolute / min : null;
    if (absolute >= absThreshold || (ratio != null && ratio >= ratioThreshold)) {
      largeDifferences.push({
        type: 'large_difference',
        scope: 'category',
        category: row.key,
        message: `Large difference in category “${row.label}”`,
        values: presentAmounts.map((a) => ({
          quoteId: a.quoteId,
          quoteLabel: a.label,
          amount: a.amount,
        })),
        ratio,
        absolute,
      });
    }
  }

  // Total large diffs
  if (quotes.length >= 2) {
    const vals = quotes.map((q) => q.total);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const absolute = max - min;
    const ratio = min > 0 ? absolute / min : null;
    if (absolute >= absThreshold || (ratio != null && ratio >= ratioThreshold)) {
      largeDifferences.push({
        type: 'large_difference',
        scope: 'total',
        message: 'Large difference in quote totals',
        values: quotes.map((q) => ({
          quoteId: q.id,
          quoteLabel: q.label,
          amount: q.total,
        })),
        ratio,
        absolute,
      });
    }
  }

  return {
    version: CONTRACTOR_QUOTE_ANALYZER_VERSION,
    qualification: CONTRACTOR_QUOTE_QUALIFICATION,
    quotes,
    quoteTotals,
    categoryMatrix,
    missingCategories,
    missingItems,
    largeDifferences,
    unitRateDifferences,
    unmatchedItems,
    includesMarketBenchmarks: false,
  };
}

export function newQuoteLineId(): string {
  return `li_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyQuote(slot: 1 | 2 | 3): ContractorQuoteInput {
  return {
    id: `q${slot}`,
    label: `Quote ${String.fromCharCode(64 + slot)}`,
    contractorName: null,
    currency: 'INR',
    items: [],
  };
}

export function csvTemplateHeaders(): string {
  return 'description,category,unit,quantity,unitRate,amount';
}
