import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import {
  GUIDE_CLUSTER_QUALIFICATION,
  buildGuideClusterLanding,
  listGuideClusters,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

export async function generateMetadata(): Promise<Metadata> {
  const indexing = resolveConstructionIndexing({
    pathname: '/construction/topics',
  });
  const title = 'Construction Topic Hubs — Cost, Cement, Steel & More | Varnarc';
  const description =
    'Structured construction topic clusters with calculators, comparisons, glossary and price links. Pillar pages organise tools — they do not auto-write articles.';
  return {
    title,
    description,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
  };
}

export const revalidate = 3600;

export default function GuideTopicsHubPage() {
  const clusters = listGuideClusters()
    .map((c) => buildGuideClusterLanding(c.slug))
    .filter((l): l is NonNullable<typeof l> => l != null);

  return (
    <ContentLayout
      title="Construction topic hubs"
      description={GUIDE_CLUSTER_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Topics' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: 'Topics', path: '/construction/topics' }])}
        itemList={{
          name: 'Construction topics',
          path: '/construction/topics',
          items: clusters.map((c) => ({
            name: c.title,
            path: c.canonicalPath,
          })),
        }}
      />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">
          Each topic hub is a pillar page that programmatically connects calculators, comparisons,
          glossary terms and price pages. Supporting guide articles are linked only when published —
          this taxonomy does not invent article text.
        </p>
      </section>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {clusters.map((c) => (
          <li key={c.slug}>
            <Link
              href={c.canonicalPath}
              className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#f97316]/40"
            >
              <h2 className="text-base font-extrabold text-[#0b1f3a]">{c.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.pillarIntro}</p>
              <p className="mt-3 text-xs font-semibold text-[#f97316]">
                {c.allLinks.length} linked resources →
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/construction/guides" className={cx.secondaryBtn}>
          CMS guides library
        </Link>
        <Link href="/construction/glossary" className={cx.secondaryBtn}>
          Glossary
        </Link>
        <Link href="/construction/compare" className={cx.secondaryBtn}>
          Comparisons
        </Link>
      </div>
    </ContentLayout>
  );
}
