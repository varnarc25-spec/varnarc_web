import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { LegalPage } from '@/components/legal/legal-page';
import { RecordContentView } from '@/components/record-content-view';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { legalContent } from '@/lib/legal-content';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { fetchPageBySlug } from '@/services/content';

const fallbackMetadata: Metadata = {
  title: 'Privacy Policy',
  description: legalContent.privacy.description,
  alternates: { canonical: '/privacy' },
};

function normalizePrivacyContent(content: string) {
  const unwrapped = content
    .replace(/^\s*<pre><code(?:\s+class="language-markdown")?>/i, '')
    .replace(/<\/code><\/pre>\s*$/i, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
  return unwrapped.replace(/^\s*#\s+Varnarc Privacy Policy\s*\n+/i, '').trim();
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await fetchPageBySlug('privacy-policy');
    return buildSeoMetadata({
      entityType: 'page',
      entityId: data.id,
      path: '/privacy',
      canonicalUrl: '/privacy',
      title: data.seo?.title || data.title,
      description: data.seo?.description || legalContent.privacy.description,
    });
  } catch {
    return fallbackMetadata;
  }
}

export default async function PrivacyPolicyPage() {
  try {
    const { data } = await fetchPageBySlug('privacy-policy');
    return (
      <>
        <RecordContentView
          entityType="page"
          entityId={data.id}
          metadata={{ slug: 'privacy-policy', title: data.title }}
        />
        <ContentLayout
          title={data.title}
          description={data.seo?.description || undefined}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
          showAd={false}
        >
          <MarkdownContent content={normalizePrivacyContent(data.content || '')} />
        </ContentLayout>
      </>
    );
  } catch {
    // Keep the legal page available if the CMS API is temporarily unavailable.
  }

  const { title, description, sections } = legalContent.privacy;
  return (
    <LegalPage
      title={title}
      description={description}
      sections={sections}
      breadcrumbLabel="Privacy Policy"
    />
  );
}
