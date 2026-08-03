import Link from 'next/link';
import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CalculatorsValidationPanel } from '@/components/calculators-validation-panel';
import type { CalculatorTableRow } from '@/components/calculators-data-table';

type CalcRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  category?: { name: string } | null;
  _count?: { fields: number; history: number };
};

const PUBLIC_APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com').replace(
  /\/$/,
  '',
);

function toTableRow(row: CalcRow): CalculatorTableRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    categoryName: row.category?.name ?? '—',
    fieldCount: row._count?.fields ?? 0,
    runCount: row._count?.history ?? 0,
    publicUrl: `${PUBLIC_APP_URL}/calculators/${row.slug}`,
  };
}

export default async function CalculatorsAdminPage() {
  const result = await apiServerFetch<CalcRow[]>('/calculators/admin/all?limit=100');
  const tableRows = (result.data ?? []).map(toTableRow);

  return (
    <div>
      <PageHeader
        title="Calculators"
        description="Configure formulas, fields, and publish calculator tools."
        actions={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/calculators/new" className="text-[var(--varnarc-brand)] hover:underline">
              New calculator
            </Link>
            <Link
              href="/calculators/categories"
              className="text-[var(--varnarc-brand)] hover:underline"
            >
              Categories
            </Link>
            <Link
              href="/calculators/analytics"
              className="text-[var(--varnarc-brand)] hover:underline"
            >
              Analytics
            </Link>
          </div>
        }
      />

      {result.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Unable to load calculators: {result.error}
        </p>
      ) : (
        <CalculatorsValidationPanel initialRows={tableRows} />
      )}
    </div>
  );
}
