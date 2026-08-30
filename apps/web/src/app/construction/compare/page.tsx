import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { SaveComparisonButton } from '@/components/construction/save-comparison-button';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionCompareAnalytics } from '@/components/construction/construction-compare-analytics';
import { EditorialCompareIndex } from '@/components/construction/compare-hub/editorial-compare-index';
import {
  COMPARE_CATEGORIES,
  resolveCompareHint,
  type CompareHubCategoryId,
} from '@/lib/construction/compare-hub/catalog';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { fetchConstructionCompare } from '@/services/construction';
import { ApiError } from '@/services/api-client';

type Props = {
  searchParams: Promise<{ ids?: string; hint?: string; category?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('compare', { searchParams: params });
}

function isCompareCategory(value: string | undefined): value is CompareHubCategoryId {
  return COMPARE_CATEGORIES.some((c) => c.id === value);
}

export default async function ConstructionComparePage({ searchParams }: Props) {
  const params = await searchParams;

  const hintSlug = resolveCompareHint(params.hint);
  if (hintSlug && !params.ids) {
    redirect(`/construction/compare/${hintSlug}`);
  }

  const ids =
    params.ids
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const activeCategory = isCompareCategory(params.category) ? params.category : 'all';

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
      description="Editorial side-by-side guides for meaningful pairs — plus live catalog compare when you pass published material IDs."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Compare' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Compare', path: '/construction/compare' },
        ])}
        itemList={{
          name: 'Editorial material comparisons',
          path: '/construction/compare',
          items: [
            { name: 'AAC vs brick', path: '/construction/compare/aac-vs-brick' },
            { name: 'OPC vs PPC', path: '/construction/compare/opc-vs-ppc' },
            { name: 'M-sand vs river sand', path: '/construction/compare/m-sand-vs-river-sand' },
            {
              name: 'Vitrified vs ceramic tiles',
              path: '/construction/compare/vitrified-vs-ceramic-tiles',
            },
            {
              name: 'uPVC vs aluminium windows',
              path: '/construction/compare/upvc-vs-aluminium-windows',
            },
            {
              name: 'Gypsum vs cement plaster',
              path: '/construction/compare/gypsum-vs-cement-plaster',
            },
          ],
        }}
      />

      {ids.length < 2 ? (
        <>
          <EditorialCompareIndex activeCategory={activeCategory} />
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-[#0b1f3a]">Catalog SKU compare</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              To compare published catalog materials, open listings and use{' '}
              <code className="rounded bg-slate-100 px-1 text-xs">
                /construction/compare?ids=uuid1,uuid2
              </code>
              . Query-parameter compares are not indexed.
            </p>
            <Link
              href="/construction/materials"
              className="mt-3 inline-block text-sm font-semibold text-[#f97316] hover:underline"
            >
              Browse materials catalog →
            </Link>
          </section>
        </>
      ) : (
        <>
          <ConstructionCompareAnalytics itemCount={ids.length} hasResults={items.length >= 2} />
          {error ? (
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
                          <td key={idx} className="px-4 py-3">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {buildProsConsSections(items).map((section) => (
                <section key={section.label} className="mt-6">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">
                    {section.label}
                  </h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {section.cards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <h3 className="text-sm font-semibold text-[#0b1f3a]">{card.name}</h3>
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                          {card.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <SaveComparisonButton ids={ids} />
              <p className="mt-6 text-sm text-slate-600">
                Looking for an educational guide?{' '}
                <Link href="/construction/compare" className="font-semibold text-[#f97316]">
                  Browse editorial comparisons
                </Link>
                .
              </p>
            </>
          ) : (
            <EmptyState
              title="No matching materials"
              message="Check that the IDs are valid published materials."
            />
          )}
        </>
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
      return text === '—'
        ? null
        : { id: String(item.id), name: String(item.name ?? item.id), text };
    })
    .filter(Boolean) as Array<{ id: string; name: string; text: string }>;

  const cons = items
    .map((item) => {
      const text = formatValue(getFieldValue(item, 'cons'));
      return text === '—'
        ? null
        : { id: String(item.id), name: String(item.name ?? item.id), text };
    })
    .filter(Boolean) as Array<{ id: string; name: string; text: string }>;

  return [
    pros.length ? { label: 'Pros', cards: pros } : null,
    cons.length ? { label: 'Cons', cards: cons } : null,
  ].filter(Boolean) as Array<{
    label: string;
    cards: Array<{ id: string; name: string; text: string }>;
  }>;
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
