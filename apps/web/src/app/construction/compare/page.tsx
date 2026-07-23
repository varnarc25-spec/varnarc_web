import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { SaveComparisonButton } from '@/components/construction/save-comparison-button';
import { fetchConstructionCompare } from '@/services/construction';
import { ApiError } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Compare Construction Materials',
  description: 'Side-by-side comparison of construction materials by specifications and price.',
  alternates: { canonical: '/construction/compare' },
};

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function ConstructionComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const ids = params.ids?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

  let items: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  if (ids.length >= 2) {
    try {
      const { data } = await fetchConstructionCompare(ids);
      items = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    } catch (e) {
      error = e instanceof ApiError ? e.message : 'Unable to load comparison';
    }
  }

  return (
    <ContentLayout
      title="Compare materials"
      description="Add ?ids=uuid1,uuid2 to compare up to six published materials."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Compare' },
      ]}
    >
      {ids.length < 2 ? (
        <EmptyState
          title="Select materials to compare"
          message="Use query params like /construction/compare?ids=id1,id2 from material listing pages."
        />
      ) : error ? (
        <EmptyState title="Comparison unavailable" message={error} />
      ) : items.length ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Field</th>
                  {items.map((item) => (
                    <th key={String(item.id)} className="px-4 py-3 font-semibold">
                      <Link
                        href={`/construction/materials/${String(item.id)}`}
                        className="text-[#0b1f3a] hover:text-[#f97316]"
                      >
                        {String(item.name ?? item.id)}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buildCompareRows(items).map((row) => (
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

          {buildProsConsSections(items).map((section) => (
            <section key={section.label} className="mt-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">{section.label}</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.cards.map((card) => (
                  <div key={card.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-[#0b1f3a]">{card.name}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{card.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <SaveComparisonButton ids={ids} />
        </>
      ) : (
        <EmptyState title="No matching materials" message="Check that the IDs are valid published materials." />
      )}
    </ContentLayout>
  );
}

function buildCompareRows(items: Array<Record<string, unknown>>) {
  const fields = [
    { label: 'Category', key: 'category.name' },
    { label: 'Brand', key: 'brand.name' },
    { label: 'Unit', key: 'unit' },
    { label: 'Approx. price', key: 'approximatePrice' },
    { label: 'Rating', key: 'rating' },
    { label: 'Pros', key: 'pros' },
    { label: 'Cons', key: 'cons' },
  ];

  return fields.map((field) => ({
    label: field.label,
    values: items.map((item) => formatValue(getFieldValue(item, field.key))),
  }));
}

function buildProsConsSections(items: Array<Record<string, unknown>>) {
  const pros = items
    .map((item) => {
      const text = formatValue(getFieldValue(item, 'pros'));
      return text === '—' ? null : { id: String(item.id), name: String(item.name ?? item.id), text };
    })
    .filter(Boolean) as Array<{ id: string; name: string; text: string }>;

  const cons = items
    .map((item) => {
      const text = formatValue(getFieldValue(item, 'cons'));
      return text === '—' ? null : { id: String(item.id), name: String(item.name ?? item.id), text };
    })
    .filter(Boolean) as Array<{ id: string; name: string; text: string }>;

  return [
    pros.length ? { label: 'Pros', cards: pros } : null,
    cons.length ? { label: 'Cons', cards: cons } : null,
  ].filter(Boolean) as Array<{ label: string; cards: Array<{ id: string; name: string; text: string }> }>;
}

function getFieldValue(obj: Record<string, unknown>, path: string): unknown {
  if (path === 'pros' || path === 'cons') {
    if (obj[path]) return obj[path];
    const specs = obj.specifications;
    if (specs && typeof specs === 'object' && path in (specs as Record<string, unknown>)) {
      return (specs as Record<string, unknown>)[path];
    }
    if (typeof specs === 'string') {
      try {
        const parsed = JSON.parse(specs) as Record<string, unknown>;
        return parsed[path];
      } catch {
        return undefined;
      }
    }
  }
  return getNestedValue(obj, path);
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
