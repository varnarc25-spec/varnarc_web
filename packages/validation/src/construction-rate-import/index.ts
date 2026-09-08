import {
  validateRateBand,
  type RateConfidence,
  type RateSourceType,
} from '../construction-rate-resolution';

export const RATE_IMPORT_CSV_HEADER =
  'Material,Specification,Brand,State,District,City,Min,Average,Max,Unit,Source,EffectiveDate,VerifiedDate,Confidence';

export type RateImportRow = {
  material: string;
  specification: string;
  brand: string;
  state: string;
  district: string;
  city: string;
  min: number;
  average: number;
  max: number;
  unit: string;
  source: string;
  effectiveDate: string;
  verifiedDate: string;
  confidence: RateConfidence;
};

export type RateImportRowError = {
  row: number;
  messages: string[];
};

const CONFIDENCE: RateConfidence[] = ['HIGH', 'MEDIUM', 'LOW'];

function num(value: string, field: string, messages: string[]): number {
  const n = Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) {
    messages.push(`${field} must be a number.`);
    return NaN;
  }
  return n;
}

export function validateRateImportRow(
  raw: Record<string, string>,
  rowNumber: number,
): { row?: RateImportRow; error?: RateImportRowError } {
  const messages: string[] = [];
  const material = (raw.Material ?? raw.material ?? '').trim();
  const specification = (raw.Specification ?? raw.specification ?? '').trim();
  const unit = (raw.Unit ?? raw.unit ?? '').trim();
  const source = (raw.Source ?? raw.source ?? '').trim();
  const effectiveDate = (raw.EffectiveDate ?? raw.effectiveDate ?? '').trim();
  const verifiedDate = (raw.VerifiedDate ?? raw.verifiedDate ?? '').trim();
  const confidenceRaw = (raw.Confidence ?? raw.confidence ?? 'LOW').trim().toUpperCase();
  if (!material) messages.push('Material is required.');
  if (!specification) messages.push('Specification is required.');
  if (!unit) messages.push('Unit is required.');
  if (!source) messages.push('Source is required.');
  if (!effectiveDate) messages.push('EffectiveDate is required.');
  const min = num(raw.Min ?? raw.min ?? '', 'Min', messages);
  const average = num(raw.Average ?? raw.average ?? '', 'Average', messages);
  const max = num(raw.Max ?? raw.max ?? '', 'Max', messages);
  if (Number.isFinite(min) && Number.isFinite(average) && Number.isFinite(max)) {
    messages.push(...validateRateBand(min, average, max));
  }
  if (!CONFIDENCE.includes(confidenceRaw as RateConfidence)) {
    messages.push('Confidence must be HIGH, MEDIUM or LOW.');
  }
  if (messages.length) return { error: { row: rowNumber, messages } };
  return {
    row: {
      material,
      specification,
      brand: (raw.Brand ?? raw.brand ?? '').trim(),
      state: (raw.State ?? raw.state ?? '').trim(),
      district: (raw.District ?? raw.district ?? '').trim(),
      city: (raw.City ?? raw.city ?? '').trim(),
      min,
      average,
      max,
      unit,
      source,
      effectiveDate,
      verifiedDate,
      confidence: confidenceRaw as RateConfidence,
    },
  };
}

export function parseRateImportCsv(csv: string): {
  rows: RateImportRow[];
  errors: RateImportRowError[];
} {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 0, messages: ['CSV must include a header and at least one data row.'] }],
    };
  }
  const header = lines[0]!.split(',').map((h) => h.trim());
  const rows: RateImportRow[] = [];
  const errors: RateImportRowError[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i]!.split(',');
    const raw: Record<string, string> = {};
    header.forEach((key, idx) => {
      raw[key] = cells[idx] ?? '';
    });
    const parsed = validateRateImportRow(raw, i + 1);
    if (parsed.error) errors.push(parsed.error);
    else if (parsed.row) rows.push(parsed.row);
  }
  return { rows, errors };
}

export function officialRateRequiresSource(
  sourceType: RateSourceType,
  sourceName: string,
): string | null {
  if (
    (sourceType === 'OFFICIAL_SOR' ||
      sourceType === 'OFFICIAL_MARKET_SURVEY' ||
      sourceType === 'OFFICIAL_STATISTICS') &&
    !sourceName.trim()
  ) {
    return 'Official rates require a named source.';
  }
  return null;
}
