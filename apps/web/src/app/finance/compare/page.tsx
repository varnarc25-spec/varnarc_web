import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchFinanceCompare } from '@/services/finance';
import { ApiError } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Compare Finance Products',
  description: 'Side-by-side comparison of loans, credit cards, insurance, and investments.',
  alternates: { canonical: '/finance/compare' },
};

type Props = {
  searchParams: Promise<{ type?: string; ids?: string }>;
};

const validTypes = ['loans', 'credit-cards', 'insurance', 'investments'] as const;

export default async function FinanceComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const type = params.type;
  const ids = params.ids?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

  let items: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  if (type && ids.length >= 2 && validTypes.includes(type as (typeof validTypes)[number])) {
    try {
      const { data } = await fetchFinanceCompare(type, ids);
      items = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    } catch (e) {
      error = e instanceof ApiError ? e.message : 'Unable to load comparison';
    }
  }

  const detailPath =
    type === 'loans'
      ? '/finance/loans'
      : type === 'credit-cards'
        ? '/finance/credit-cards'
        : type === 'insurance'
          ? '/finance/insurance'
          : type === 'investments'
            ? '/finance/investments'
            : null;

  return (
    <ContentLayout
      title="Compare products"
      description="Add ?type=loans&ids=uuid1,uuid2 to compare up to six published products."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Compare' },
      ]}
    >
      {!type || ids.length < 2 ? (
        <EmptyState
          title="Select products to compare"
          message="Use query params like /finance/compare?type=loans&ids=id1,id2 from listing pages."
        />
      ) : error ? (
        <EmptyState title="Comparison unavailable" message={error} />
      ) : items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Field</th>
                {items.map((item) => (
                  <th key={String(item.id)} className="px-4 py-3 font-semibold">
                    {detailPath ? (
                      <Link href={`${detailPath}/${String(item.id)}`} className="text-[#0b1f3a] hover:text-[#f97316]">
                        {String(item.name ?? item.id)}
                      </Link>
                    ) : (
                      String(item.name ?? item.id)
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buildCompareRows(type, items).map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-600">{row.label}</td>
                  {row.values.map((value, idx) => (
                    <td key={idx} className="px-4 py-3">{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No matching products" message="Check that the IDs are valid published products." />
      )}
    </ContentLayout>
  );
}

function buildCompareRows(type: string, items: Array<Record<string, unknown>>) {
  const fields: Array<{ label: string; key: string }> =
    type === 'loans'
      ? [
          { label: 'Bank', key: 'bank.name' },
          { label: 'Type', key: 'loanType' },
          { label: 'Interest rate', key: 'interestRate' },
          { label: 'Max amount', key: 'maxAmount' },
          { label: 'Tenure', key: 'tenureMax' },
        ]
      : type === 'credit-cards'
        ? [
            { label: 'Bank', key: 'bank.name' },
            { label: 'Annual fee', key: 'annualFee' },
            { label: 'Rewards', key: 'rewards' },
            { label: 'Cashback', key: 'cashback' },
            { label: 'Lounge access', key: 'loungeAccess' },
          ]
        : type === 'insurance'
          ? [
              { label: 'Provider', key: 'providerName' },
              { label: 'Premium', key: 'premium' },
              { label: 'Coverage', key: 'coverage' },
            ]
          : [
              { label: 'Provider', key: 'providerName' },
              { label: 'Expected return', key: 'expectedReturn' },
              { label: 'Risk level', key: 'riskLevel' },
              { label: 'Lock-in', key: 'lockInPeriod' },
            ];

  return fields.map((field) => ({
    label: field.label,
    values: items.map((item) => formatValue(getNestedValue(item, field.key))),
  }));
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function formatValue(value: unknown) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
