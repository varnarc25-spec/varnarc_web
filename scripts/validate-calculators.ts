#!/usr/bin/env tsx
/**
 * Validate all published calculators against the public API.
 *
 * Usage:
 *   API_URL=https://api.varnarc.com/api/v1 pnpm exec tsx scripts/validate-calculators.ts
 */
import {
  validateAllCalculators,
  type CalculatorValidationTarget,
} from '../apps/admin/src/lib/calculator-validation';

const apiUrl = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1'
).replace(/\/$/, '');

type ListRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

async function fetchPublished(): Promise<CalculatorValidationTarget[]> {
  const rows: ListRow[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 20; page += 1) {
    const qs = new URLSearchParams({ limit: '100', status: 'PUBLISHED' });
    if (cursor) qs.set('cursor', cursor);
    const res = await fetch(`${apiUrl}/calculators?${qs.toString()}`);
    const json = (await res.json()) as {
      success?: boolean;
      data?: ListRow[];
      meta?: { nextCursor?: string | null };
      error?: { message?: string };
    };
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `List failed (${res.status})`);
    }
    rows.push(...(json.data ?? []));
    cursor = json.meta?.nextCursor ?? null;
    if (!cursor) break;
  }

  return rows;
}

async function main() {
  console.log(`Validating calculators at ${apiUrl}`);
  const calculators = await fetchPublished();
  console.log(`Found ${calculators.length} published calculators`);

  const results = await validateAllCalculators(apiUrl, calculators);
  const failed = results.filter((r) => !r.ok && !r.message.startsWith('Skipped'));
  const passed = results.filter((r) => r.ok && !r.message.startsWith('Skipped'));

  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length) {
    console.log('\nFailures:');
    for (const row of failed) {
      console.log(`- ${row.name} (${row.slug}): ${row.message}`);
    }
    process.exit(1);
  }

  console.log('\nAll published calculators validated successfully.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
