import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { SupplierCardView } from '@/components/construction/supplier-directory/supplier-card';
import { fetchSupplierDirectory } from '@/lib/construction/supplier-directory/api';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import {
  SUPPLIER_DIRECTORY_CATEGORIES,
  SUPPLIER_DIRECTORY_CITIES,
  SUPPLIER_DIRECTORY_QUALIFICATION,
} from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

type Props = {
  searchParams: Promise<{
    location?: string;
    category?: string;
    brand?: string;
    verified?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('suppliers', { searchParams: params });
}

export const revalidate = 120;

export default async function ConstructionSuppliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const directory = await fetchSupplierDirectory({
    location: params.location,
    category: params.category,
    brand: params.brand,
    verified: params.verified,
    sort: params.sort === 'recent' ? 'recent' : 'name',
    limit: 48,
  });

  const listings = directory?.listings ?? [];
  const sponsored = directory?.sponsoredListings ?? [];
  const qualification = directory?.qualification ?? SUPPLIER_DIRECTORY_QUALIFICATION;

  function hrefWith(patch: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const next = {
      location: params.location,
      category: params.category,
      brand: params.brand,
      verified: params.verified,
      sort: params.sort,
      ...patch,
    };
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `/construction/suppliers?${qs}` : '/construction/suppliers';
  }

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Suppliers', path: '/construction/suppliers' },
        ])}
      />
      <ContentLayout
        title="Construction suppliers"
        description="Browse material suppliers and related trades from the Varnarc directory. Listings are not ranked as “best”."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Suppliers' },
        ]}
      >
        <p className="mb-4 text-sm leading-relaxed text-slate-600">{qualification}</p>
        {directory?.meta.rankingNote ? (
          <p className="mb-6 text-xs text-slate-500">{directory.meta.rankingNote}</p>
        ) : null}

        <form
          method="get"
          action="/construction/suppliers"
          className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Location</span>
            <select name="location" defaultValue={params.location ?? ''} className={cx.input}>
              <option value="">All cities</option>
              {SUPPLIER_DIRECTORY_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Category</span>
            <select name="category" defaultValue={params.category ?? ''} className={cx.input}>
              <option value="">All categories</option>
              {SUPPLIER_DIRECTORY_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Brand carried</span>
            <input
              name="brand"
              defaultValue={params.brand ?? ''}
              placeholder="e.g. UltraTech"
              className={cx.input}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Verified</span>
            <select name="verified" defaultValue={params.verified ?? ''} className={cx.input}>
              <option value="">Any</option>
              <option value="true">Verified only</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Sort</span>
            <select name="sort" defaultValue={params.sort ?? 'name'} className={cx.input}>
              <option value="name">Name (A–Z)</option>
              <option value="recent">Recently updated</option>
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <button type="submit" className={cx.primaryBtn}>
              Apply filters
            </button>
            {(params.location || params.category || params.brand || params.verified) && (
              <Link href="/construction/suppliers" className={cn(cx.secondaryBtn, 'ml-2')}>
                Clear
              </Link>
            )}
          </div>
        </form>

        <div className="mb-6 flex flex-wrap gap-2">
          {SUPPLIER_DIRECTORY_CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={hrefWith({ category: c.key })}
              className={cn(
                'rounded-lg border px-3 py-1 text-xs font-semibold',
                params.category === c.key
                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                  : 'border-slate-200 bg-white text-slate-700',
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {sponsored.length ? (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#f97316]">
              Sponsored placements
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Clearly labelled sponsored listings — not ranked as better suppliers.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsored.map((s) => (
                <SupplierCardView key={s.id} supplier={s} />
              ))}
            </div>
          </section>
        ) : null}

        {listings.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((s) => (
              <SupplierCardView key={s.id} supplier={s} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No supplier listings match"
            message="Try another city or category. Listings appear when directory businesses are tagged with construction categories."
            action={
              <Link
                href="/directory?vertical=construction"
                className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white"
              >
                Browse full directory
              </Link>
            }
          />
        )}
      </ContentLayout>
    </>
  );
}
