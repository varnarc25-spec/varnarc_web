import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { GuideClusterPillarView } from '@/components/construction/guide-clusters/guide-cluster-link-blocks';
import {
  buildGuideClusterLanding,
  isGuideClusterSlug,
  listGuideClusters,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ cluster: string }> };

export async function generateStaticParams() {
  return listGuideClusters()
    .filter((c) => buildGuideClusterLanding(c.slug))
    .map((c) => ({ cluster: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cluster } = await params;
  if (!isGuideClusterSlug(cluster)) {
    return { robots: { index: false, follow: false } };
  }
  const landing = buildGuideClusterLanding(cluster);
  if (!landing) {
    return { title: 'Topic unavailable', robots: { index: false, follow: false } };
  }
  const indexing = resolveConstructionIndexing({
    pathname: landing.canonicalPath,
  });
  return {
    title: landing.seoTitle,
    description: landing.seoDescription,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
    openGraph: {
      title: landing.seoTitle,
      description: landing.seoDescription,
      url: indexing.canonicalUrl,
      type: 'article',
    },
  };
}

export const revalidate = 3600;
export const dynamicParams = false;

export default async function GuideClusterPillarPage({ params }: Props) {
  const { cluster } = await params;
  if (!isGuideClusterSlug(cluster)) notFound();

  const landing = buildGuideClusterLanding(cluster);
  if (!landing) notFound();

  return (
    <ContentLayout
      title={landing.title}
      description={landing.seoDescription}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Topics', href: '/construction/topics' },
        { label: landing.title },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Topics', path: '/construction/topics' },
          { name: landing.title, path: landing.canonicalPath },
        ])}
        article={{
          title: landing.seoTitle,
          description: landing.seoDescription,
          path: landing.canonicalPath,
        }}
        itemList={{
          name: `${landing.title} resources`,
          path: landing.canonicalPath,
          items: landing.allLinks.map((l) => ({ name: l.label, path: l.href })),
        }}
      />

      <GuideClusterPillarView landing={landing} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/topics" className={cx.secondaryBtn}>
          All topics
        </Link>
        <Link href="/construction/guides" className={cx.secondaryBtn}>
          CMS guides
        </Link>
        <Link href="/construction/glossary" className={cx.secondaryBtn}>
          Glossary
        </Link>
      </div>
    </ContentLayout>
  );
}
