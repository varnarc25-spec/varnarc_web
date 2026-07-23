#!/usr/bin/env tsx
/**
 * Large-scale catalog CSV import via the platform API.
 *
 * Usage:
 *   pnpm catalog:import -- --vertical finance --entity loans --file ./data/loans.csv
 *
 * Env:
 *   API_URL or NEXT_PUBLIC_API_URL — default http://localhost:4000/api/v1
 *   CATALOG_IMPORT_TOKEN — Bearer JWT with finance/construction/automobile create perms
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const vertical = arg('vertical');
  const entity = arg('entity');
  const file = arg('file');
  const batchSize = arg('batch-size') ?? '500';
  const reindex = arg('reindex') ?? 'true';

  if (!vertical || !entity || !file) {
    console.error(
      'Usage: pnpm catalog:import -- --vertical finance|construction|automobile --entity <entity> --file <path.csv> [--batch-size 500] [--reindex true]',
    );
    process.exit(1);
  }

  const apiUrl = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
    /\/$/,
    '',
  );
  const token = process.env.CATALOG_IMPORT_TOKEN?.trim();
  if (!token) {
    console.error('Set CATALOG_IMPORT_TOKEN to a valid admin API bearer token.');
    process.exit(1);
  }

  const csv = readFileSync(resolve(file), 'utf8');
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), file.split('/').pop() ?? 'import.csv');

  const url = `${apiUrl}/catalog/ops/import?vertical=${encodeURIComponent(vertical)}&entity=${encodeURIComponent(entity)}&batchSize=${batchSize}&reindex=${reindex}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = (await res.json()) as { data?: unknown; error?: { message?: string } };
  if (!res.ok) {
    console.error(json.error?.message ?? `Import failed (${res.status})`);
    process.exit(1);
  }

  console.log(JSON.stringify(json.data, null, 2));
}

void main();
