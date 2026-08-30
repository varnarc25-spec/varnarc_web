import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { IntentCalcLandingView } from '@/components/construction/intent-calc/intent-calc-landing-view';
import {
  buildIntentCalcLanding,
  isIntentCalcAreaSlug,
  isIntentCalcTopicKey,
  listIndexableIntentCalcLandings,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ topic: string; area: string }> };

export async function generateStaticParams() {
  return listIndexableIntentCalcLandings().map((p) => ({
    topic: p.topic,
    area: p.area,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, area } = await params;
  if (!isIntentCalcTopicKey(topic) || !isIntentCalcAreaSlug(area)) {
    return { robots: { index: false, follow: false } };
  }
  const landing = buildIntentCalcLanding({ topic, area });
  if (!landing) {
    return {
      title: 'Calculation unavailable',
      robots: { index: false, follow: false },
    };
  }
  const indexing = resolveConstructionIndexing({
    pathname: landing.canonicalPath,
  });
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
/** Reject arbitrary topic×area combos at runtime — only curated pairs resolve. */
export const dynamicParams = false;

export default async function IntentCalcLandingPage({ params }: Props) {
  const { topic, area } = await params;
  if (!isIntentCalcTopicKey(topic) || !isIntentCalcAreaSlug(area)) notFound();

  const landing = buildIntentCalcLanding({ topic, area });
  if (!landing) notFound();

  const path = landing.canonicalPath;

  return (
    <ContentLayout
      title={landing.h1}
      description={landing.qualification}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Calculations', href: '/construction/calc' },
        { label: `${landing.topic.label} · ${landing.area.label}` },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Calculations', path: '/construction/calc' },
          { name: landing.h1, path },
        ])}
        article={{
          title: landing.h1,
          description: landing.description,
          path,
        }}
        faqs={landing.faqs}
        webApplication={{
          name: landing.calculatorLabel,
          description: landing.description,
          path: landing.calculatorHref.split('?')[0]!,
        }}
      />

      <IntentCalcLandingView landing={landing} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/calc" className={cx.secondaryBtn}>
          All calculation landings
        </Link>
        <Link href="/construction" className={cx.secondaryBtn}>
          Construction hub
        </Link>
      </div>
    </ContentLayout>
  );
}
