import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { LegalPage } from '@/components/legal/legal-page';
import { RecordContentView } from '@/components/record-content-view';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { legalContent } from '@/lib/legal-content';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { fetchPageBySlug } from '@/services/content';

const fallbackMetadata: Metadata = {
  title: 'Terms of Service',
  description: legalContent.terms.description,
  alternates: { canonical: '/terms' },
};

function normalizeTermsContent(content: string) {
  const unwrapped = content
    .replace(/^\s*<pre><code(?:\s+class="language-markdown")?>/i, '')
    .replace(/<\/code><\/pre>\s*$/i, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
  return unwrapped.replace(/^\s*#\s+(?:Varnarc )?Terms of Service\s*\n+/i, '').trim();
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await fetchPageBySlug('terms-of-service');
    return buildSeoMetadata({
      entityType: 'page',
      entityId: data.id,
      path: '/terms',
      canonicalUrl: '/terms',
      title: data.seo?.title || data.title,
      description: data.seo?.description || legalContent.terms.description,
    });
  } catch {
    return fallbackMetadata;
  }
}

export default async function TermsOfServicePage() {
  try {
    const { data } = await fetchPageBySlug('terms-of-service');
    return (
      <>
        <RecordContentView
          entityType="page"
          entityId={data.id}
          metadata={{ slug: 'terms-of-service', title: data.title }}
        />
        <ContentLayout
          title={data.title}
          description={data.seo?.description || undefined}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
          showAd={false}
        >
          <MarkdownContent content={normalizeTermsContent(data.content || '')} />
        </ContentLayout>
      </>
    );
  } catch {
    // Keep the legal page available if the CMS API is temporarily unavailable.
  }

  const { title, description, sections } = legalContent.terms;
  return (
    <LegalPage
      title={title}
      description={description}
      sections={sections}
      breadcrumbLabel="Terms of Service"
    />
  );
}
