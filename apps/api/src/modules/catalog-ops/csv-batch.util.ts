/**
 * Split a CSV into smaller CSV strings (header preserved) for batched imports.
 */
export function splitCsvIntoBatches(csvText: string, batchSize = 500): string[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const header = lines[0]!;
  const dataLines = lines.slice(1);
  const batches: string[] = [];

  for (let i = 0; i < dataLines.length; i += batchSize) {
    const chunk = dataLines.slice(i, i + batchSize);
    batches.push([header, ...chunk].join('\n'));
  }

  return batches;
}

export function countCsvDataRows(csvText: string): number {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return Math.max(0, lines.length - 1);
}
