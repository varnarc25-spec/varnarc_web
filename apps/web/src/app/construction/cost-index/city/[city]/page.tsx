import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { VcciHistoryChart } from '@/components/construction/vcci/vcci-views';
import { fetchPublishedVcciCities, fetchVcciCity } from '@/lib/construction/vcci/api';
import { VCCI_QUALIFICATION, isPriceHubCitySlug } from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cn, cx } from '@/components/construction/styles';

type Props = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  const cities = await fetchPublishedVcciCities();
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  if (!isPriceHubCitySlug(city)) return { robots: { index: false, follow: false } };
  const data = await fetchVcciCity(city);
  if (!data) return { title: 'VCCI unavailable', robots: { index: false, follow: false } };
  const indexing = resolveConstructionIndexing({
    pathname: `/construction/cost-index/city/${city}`,
  });
  return {
    title: `VCCI in ${data.city.name} | Varnarc`,
    description: `Varnarc Construction Cost Index for ${data.city.name}. Verify locally — index values are indicative.`,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
  };
}

export const revalidate = 300;
export const dynamicParams = true;

export default async function VcciCityPage({ params }: Props) {
  const { city } = await params;
  if (!isPriceHubCitySlug(city)) notFound();
  const data = await fetchVcciCity(city);
  if (!data) notFound();

  const path = `/construction/cost-index/city/${city}`;

  return (
    <ContentLayout
      title={`VCCI · ${data.city.name}`}
      description={VCCI_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost index', href: '/construction/cost-index' },
        { label: data.city.name },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost index', path: '/construction/cost-index' },
          { name: data.city.name, path },
        ])}
      />

      <section className={cn(cx.card, 'mb-8 p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          City view · {data.current.methodologyVersion}
        </p>
        <p className="mt-2 text-4xl font-extrabold tabular-nums text-[#0b1f3a]">
          {data.current.indexValue.toFixed(1)}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Calculation date{' '}
          {new Date(data.current.calculationDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-[#0b1f3a]">Historical chart</h2>
        {data.showChart ? (
          <VcciHistoryChart history={data.history} />
        ) : (
          <p className="text-sm text-slate-600">
            Chart appears when at least three published calculation dates exist for this city.
          </p>
        )}
      </section>

      <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-100">
        {VCCI_QUALIFICATION}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href="/construction/cost-index" className={cx.primaryBtn}>
          National VCCI
        </Link>
        <Link href="/construction/cost-index/methodology" className={cx.secondaryBtn}>
          Methodology
        </Link>
      </div>
    </ContentLayout>
  );
}
