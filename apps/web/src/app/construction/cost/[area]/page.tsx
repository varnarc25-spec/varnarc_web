import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionCostAreaView } from '@/components/construction/construction-cost-area/construction-cost-area-view';
import {
  buildConstructionCostAreaLanding,
  isConstructionCostAreaSlug,
  listIndexableConstructionCostAreaLandings,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ area: string }> };

export async function generateStaticParams() {
  return listIndexableConstructionCostAreaLandings().map((item) => ({ area: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  if (!isConstructionCostAreaSlug(area)) {
    return { robots: { index: false, follow: false } };
  }
  const landing = buildConstructionCostAreaLanding(area);
  if (!landing) {
    return { title: 'Construction cost unavailable', robots: { index: false, follow: false } };
  }
  const indexing = resolveConstructionIndexing({ pathname: landing.canonicalPath });
  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
    openGraph: {
      title: landing.title,
      description: landing.description,
      url: indexing.canonicalUrl,
      type: 'article',
    },
  };
}

export const revalidate = 3600;
export const dynamicParams = false;

export default async function ConstructionCostAreaPage({ params }: Props) {
  const { area } = await params;
  if (!isConstructionCostAreaSlug(area)) notFound();
  const landing = buildConstructionCostAreaLanding(area);
  if (!landing) notFound();

  return (
    <ContentLayout
      title={landing.h1}
      description={landing.qualification}
      hideTitle
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost by area', href: '/construction/cost' },
        { label: landing.label },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost by area', path: '/construction/cost' },
          { name: landing.h1, path: landing.canonicalPath },
        ])}
        article={{
          title: landing.h1,
          description: landing.description,
          path: landing.canonicalPath,
        }}
        faqs={landing.faqs}
        webApplication={{
          name: `${landing.label} construction cost calculator`,
          description: landing.description,
          path: '/construction/cost-calculator',
        }}
      />

      <ConstructionCostAreaView landing={landing} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/cost" className={cx.secondaryBtn}>
          All house sizes
        </Link>
        <Link href="/construction/construction-cost" className={cx.secondaryBtn}>
          Cost by city
        </Link>
      </div>
    </ContentLayout>
  );
}
