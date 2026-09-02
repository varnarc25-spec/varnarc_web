export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const lines = splitCsvLines(text.replace(/^\uFEFF/, ''));
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      row[header] = (cols[i] ?? '').trim();
    });
    return row;
  });
}

export function detectAutomobileCsvEntity(fileName: string, headers: string[]): string {
  const name = fileName.toLowerCase();
  if (name.includes('manufacturer')) return 'manufacturers';
  if (name.includes('image')) return 'vehicle-images';
  if (name.includes('review')) return 'vehicle-reviews';
  if (name.includes('spec') || name.includes('cars')) return 'specs';
  if (name.includes('vehicle')) return 'vehicles';
  const set = new Set(headers.map((h) => h.toLowerCase()));
  if (set.has('make') && set.has('model')) return 'specs';
  if (set.has('imageurl') || set.has('image_url')) return 'vehicle-images';
  if (set.has('reviewslug') || set.has('reviewid')) return 'vehicle-reviews';
  if (set.has('country') && set.has('slug') && set.has('name') && !set.has('model')) {
    return 'manufacturers';
  }
  return 'vehicles';
}

export function slugify(value: string, max = 90): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.slice(0, max) || 'vehicle';
}

export const MERGE_IMPORT_ORDER = [
  'manufacturers',
  'specs',
  'vehicles',
  'vehicle-images',
  'vehicle-reviews',
] as const;

function splitCsvLines(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      current += ch;
      if (inQuotes && text[i + 1] === '"') {
        current += text[i + 1];
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      if (current.trim()) rows.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) rows.push(current);
  return rows;
}

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cols.push(current);
  return cols;
}
