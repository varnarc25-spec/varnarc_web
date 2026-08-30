import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { VcciHistoryChart } from '@/components/construction/vcci/vcci-views';
import { fetchVcciComponent, fetchVcciHub } from '@/lib/construction/vcci/api';
import { VCCI_COMPONENTS, VCCI_QUALIFICATION, isVcciComponentKey } from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cn, cx } from '@/components/construction/styles';

type Props = { params: Promise<{ component: string }> };

export async function generateStaticParams() {
  const hub = await fetchVcciHub();
  if (!hub?.published) return [];
  return hub.availableComponents.map((c) => ({ component: c.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { component } = await params;
  if (!isVcciComponentKey(component)) return { robots: { index: false, follow: false } };
  const data = await fetchVcciComponent(component);
  if (!data)
    return { title: 'VCCI component unavailable', robots: { index: false, follow: false } };
  const indexing = resolveConstructionIndexing({
    pathname: `/construction/cost-index/components/${component}`,
  });
  return {
    title: `VCCI ${data.component.label} component | Varnarc`,
    description: `VCCI component series for ${data.component.label}. Indicative only — see methodology.`,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
  };
}

export const revalidate = 300;
export const dynamicParams = true;

export default async function VcciComponentPage({ params }: Props) {
  const { component } = await params;
  if (!isVcciComponentKey(component)) notFound();
  const data = await fetchVcciComponent(component);
  if (!data) notFound();

  const path = `/construction/cost-index/components/${component}`;

  return (
    <ContentLayout
      title={`VCCI · ${data.component.label}`}
      description={data.component.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost index', href: '/construction/cost-index' },
        { label: data.component.label },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost index', path: '/construction/cost-index' },
          { name: data.component.label, path },
        ])}
      />

      <section className={cn(cx.card, 'mb-8 p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Component view · weight {(data.component.defaultWeight * 100).toFixed(0)}%
        </p>
        <p className="mt-2 text-4xl font-extrabold tabular-nums text-[#0b1f3a]">
          {data.current.indexValue.toFixed(1)}
        </p>
        <p className="mt-2 text-sm text-slate-600">{data.component.sourceHint}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-[#0b1f3a]">Historical chart</h2>
        {data.showChart ? (
          <VcciHistoryChart history={data.history} />
        ) : (
          <p className="text-sm text-slate-600">
            Chart appears when at least three published points exist for this component.
          </p>
        )}
      </section>

      <ul className="mb-6 flex flex-wrap gap-2">
        {VCCI_COMPONENTS.map((c) => (
          <li key={c.key}>
            <Link
              href={`/construction/cost-index/components/${c.key}`}
              className={c.key === component ? cx.primaryBtn : cx.secondaryBtn}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-100">
        {VCCI_QUALIFICATION}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link href="/construction/cost-index" className={cx.primaryBtn}>
          Overall VCCI
        </Link>
        <Link href="/construction/cost-index/methodology" className={cx.secondaryBtn}>
          Methodology
        </Link>
      </div>
    </ContentLayout>
  );
}
