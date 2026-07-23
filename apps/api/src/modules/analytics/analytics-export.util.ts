/** Build export payloads for CSV, Excel-compatible CSV, and minimal PDF. */

export function buildCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    keys.join(','),
    ...rows.map((row) => keys.map((k) => esc(row[k])).join(',')),
  ].join('\n');
}

export function buildExcelCsv(csv: string) {
  // UTF-8 BOM helps Excel open CSV with correct encoding
  return `\uFEFF${csv}`;
}

/** Minimal single-page PDF with plain text lines (valid PDF 1.4 subset). */
export function buildMinimalPdf(lines: string[]) {
  const sanitized = lines
    .join('\n')
    .slice(0, 8000)
    .replace(/[^\x20-\x7E\n\r\t]/g, '?');
  const contentLines = sanitized.split('\n').slice(0, 80);
  let y = 750;
  const textOps = contentLines
    .map((line) => {
      const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      const op = `BT /F1 10 Tf 50 ${y} Td (${escaped}) Tj ET`;
      y -= 14;
      return op;
    })
    .join('\n');

  const stream = `${textOps}\n`;
  const streamLen = Buffer.byteLength(stream, 'utf8');

  const objects = [
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>endobj',
    `4 0 obj<< /Length ${streamLen} >>stream\n${stream}endstream\nendobj`,
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export function flattenReportForCsv(report: Record<string, unknown>): Array<Record<string, unknown>> {
  if (Array.isArray(report.topPaths)) {
    return (report.topPaths as Array<Record<string, unknown>>).map((r) => ({
      section: 'topPaths',
      ...r,
    }));
  }
  if (Array.isArray(report.eventCounts)) {
    return (report.eventCounts as Array<Record<string, unknown>>).map((r) => ({
      section: 'eventCounts',
      ...r,
    }));
  }
  if (Array.isArray(report.partners)) {
    return (report.partners as Array<Record<string, unknown>>).map((r) => ({
      section: 'partners',
      ...r,
    }));
  }
  if (Array.isArray(report.topAds)) {
    return (report.topAds as Array<Record<string, unknown>>).map((r) => ({
      section: 'topAds',
      ...r,
    }));
  }
  return [
    {
      report: String(report.report ?? 'overview'),
      payload: JSON.stringify(report),
    },
  ];
}
