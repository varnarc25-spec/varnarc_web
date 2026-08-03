import { NextResponse } from 'next/server';
import { getApiAccessToken, getApiBaseUrl } from '@/lib/api';
import {
  validateAllCalculators,
  type CalculatorValidationTarget,
} from '@/lib/calculator-validation';

type CalcRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

async function fetchAllCalculators(apiUrl: string, token: string): Promise<CalcRow[]> {
  const rows: CalcRow[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 20; page += 1) {
    const qs = new URLSearchParams({ limit: '100' });
    if (cursor) qs.set('cursor', cursor);
    const res = await fetch(`${apiUrl}/calculators/admin/all?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json = (await res.json()) as {
      success?: boolean;
      data?: CalcRow[];
      meta?: { nextCursor?: string | null };
      error?: { message?: string };
    };
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Failed to list calculators (${res.status})`);
    }
    rows.push(...(json.data ?? []));
    cursor = json.meta?.nextCursor ?? null;
    if (!cursor) break;
  }

  return rows;
}

export async function POST() {
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const apiUrl = getApiBaseUrl();

  try {
    const calculators = await fetchAllCalculators(apiUrl, token);
    const targets: CalculatorValidationTarget[] = calculators.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: row.status,
    }));

    const results = await validateAllCalculators(apiUrl, targets);
    const published = results.filter((r) => !r.message.startsWith('Skipped'));
    const passed = published.filter((r) => r.ok);
    const failed = published.filter((r) => !r.ok);
    const skipped = results.filter((r) => r.message.startsWith('Skipped'));

    return NextResponse.json({
      summary: {
        total: results.length,
        published: published.length,
        passed: passed.length,
        failed: failed.length,
        skipped: skipped.length,
      },
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      },
      { status: 500 },
    );
  }
}
