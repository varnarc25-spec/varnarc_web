import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionGlossaryTermView } from '@/components/construction/glossary/glossary-term-view';
import {
  buildConstructionGlossaryTermLanding,
  isConstructionGlossarySlug,
  listIndexableConstructionGlossaryTerms,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return listIndexableConstructionGlossaryTerms().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isConstructionGlossarySlug(slug)) {
    return { robots: { index: false, follow: false } };
  }
  const landing = buildConstructionGlossaryTermLanding(slug);
  if (!landing) {
    return {
      title: 'Glossary term unavailable',
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
export const dynamicParams = false;

export default async function ConstructionGlossaryTermPage({ params }: Props) {
  const { slug } = await params;
  if (!isConstructionGlossarySlug(slug)) notFound();

  const landing = buildConstructionGlossaryTermLanding(slug);
  if (!landing) notFound();

  return (
    <ContentLayout
      title={landing.term}
      description={landing.simpleDefinition}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Glossary', href: '/construction/glossary' },
        { label: landing.term },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Glossary', path: '/construction/glossary' },
          { name: landing.term, path: landing.canonicalPath },
        ])}
        article={{
          title: landing.title,
          description: landing.description,
          path: landing.canonicalPath,
        }}
        faqs={landing.faqs}
      />

      <ConstructionGlossaryTermView landing={landing} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/glossary" className={cx.secondaryBtn}>
          Glossary hub
        </Link>
        <Link href="/construction/faqs" className={cx.secondaryBtn}>
          Construction FAQs
        </Link>
      </div>
    </ContentLayout>
  );
}
