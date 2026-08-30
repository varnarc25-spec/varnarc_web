import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { SupplierCardView } from '@/components/construction/supplier-directory/supplier-card';
import {
  fetchSupplierLanding,
  fetchSupplierLandings,
} from '@/lib/construction/supplier-directory/api';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import {
  SUPPLIER_DIRECTORY_QUALIFICATION,
  getSupplierDirectoryCategory,
  isSupplierDirectoryCategoryKey,
} from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

type Props = {
  params: Promise<{ category: string; city: string }>;
};

export async function generateStaticParams() {
  const pairs = await fetchSupplierLandings();
  return pairs.map((p) => ({ category: p.category, city: p.city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, city } = await params;
  const landing = await fetchSupplierLanding(category, city);
  if (!landing) {
    return { title: 'Suppliers', robots: { index: false, follow: false } };
  }
  return {
    title: `${landing.category.label} suppliers in ${landing.city.name} | Varnarc`,
    description: `Browse ${landing.sampleSize} ${landing.category.label.toLowerCase()} supplier listings in ${landing.city.name}. Not ranked as best — sponsored placements are labelled.`,
    alternates: { canonical: landing.canonicalPath },
  };
}

export const revalidate = 300;

export default async function SupplierLandingPage({ params }: Props) {
  const { category, city } = await params;
  if (!isSupplierDirectoryCategoryKey(category)) notFound();

  const landing = await fetchSupplierLanding(category, city);
  if (!landing) notFound();

  const cat = getSupplierDirectoryCategory(category);

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Suppliers', path: '/construction/suppliers' },
          {
            name: `${landing.category.label} · ${landing.city.name}`,
            path: landing.canonicalPath,
          },
        ])}
      />
      <ContentLayout
        title={`${landing.category.label} suppliers in ${landing.city.name}`}
        description={`${landing.sampleSize} listings with useful information. Sorted by name — not ranked as “best”.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Suppliers', href: '/construction/suppliers' },
          { label: `${cat?.label ?? category} · ${landing.city.name}` },
        ]}
      >
        <p className="mb-6 text-sm text-slate-600">{landing.qualification}</p>

        {landing.sponsoredListings.length ? (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#f97316]">
              Sponsored placements
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {landing.sponsoredListings.map((s) => (
                <SupplierCardView key={s.id} supplier={s} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landing.listings
            .filter((l) => !l.sponsored)
            .map((s) => (
              <SupplierCardView key={s.id} supplier={s} />
            ))}
        </div>

        <p className="mt-8 text-xs text-slate-500">{SUPPLIER_DIRECTORY_QUALIFICATION}</p>
        <Link
          href={`/construction/suppliers?category=${category}&location=${city}`}
          className={cx.secondaryBtn + ' mt-4 inline-flex'}
        >
          Open filtered hub →
        </Link>
      </ContentLayout>
    </>
  );
}
