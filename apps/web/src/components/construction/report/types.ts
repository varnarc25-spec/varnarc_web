/**
 * Reusable Construction Calculation Report data model.
 * Keep free of private user/project fields unless the caller explicitly includes them.
 */

export type ConstructionReportKv = {
  id?: string;
  label: string;
  value: string;
  hint?: string;
};

export type ConstructionReportMethodology = {
  formula?: string;
  steps?: string[];
  versionLabel?: string;
};

export type ConstructionCalculationReportData = {
  /** Stable tool id, e.g. cost-calculator */
  calculatorSlug: string;
  /** Report heading */
  title: string;
  /** Optional secondary line (scenario name, BOQ title) — never user email/phone */
  subtitle?: string;
  /** ISO timestamp */
  generatedAt: string;
  currency?: string;
  inputs: ConstructionReportKv[];
  results: ConstructionReportKv[];
  breakdown?: ConstructionReportKv[];
  /** Optional table-style breakdown for BOQ / multi-row */
  breakdownRows?: Array<{
    label: string;
    quantity?: string;
    unit?: string;
    rate?: string;
    amount?: string;
  }>;
  assumptions?: string[];
  methodology?: ConstructionReportMethodology;
  disclaimer?: string;
  logoSrc?: string;
};

export const DEFAULT_CONSTRUCTION_REPORT_DISCLAIMER =
  'Indicative planning figures only. Not a quotation, quotation substitute, or professional certification. Verify with a licensed architect, engineer, or contractor before purchasing materials or signing contracts.';

export function formatReportDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Flatten a plain object into report KV rows (public fields only). */
export function kvFromRecord(
  record: Record<string, unknown> | null | undefined,
  opts?: { excludeKeys?: string[]; max?: number },
): ConstructionReportKv[] {
  if (!record) return [];
  const exclude = new Set(
    (opts?.excludeKeys ?? [])
      .map((k) => k.toLowerCase())
      .concat(['projectid', 'userid', 'email', 'phone', 'password', 'token']),
  );
  const rows: ConstructionReportKv[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (exclude.has(key.toLowerCase())) continue;
    if (value == null || value === '') continue;
    if (typeof value === 'object') continue;
    rows.push({
      id: key,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim(),
      value: String(value),
    });
    if (opts?.max && rows.length >= opts.max) break;
  }
  return rows;
}
