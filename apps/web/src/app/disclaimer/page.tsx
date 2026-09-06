import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { LegalPage } from '@/components/legal/legal-page';
import { RecordContentView } from '@/components/record-content-view';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { legalContent } from '@/lib/legal-content';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { fetchPageBySlug } from '@/services/content';

const fallbackMetadata: Metadata = {
  title: 'Disclaimer',
  description: legalContent.disclaimer.description,
  alternates: { canonical: '/disclaimer' },
};

function normalizeDisclaimerContent(content: string) {
  const unwrapped = content
    .replace(/^\s*<pre><code(?:\s+class="language-markdown")?>/i, '')
    .replace(/<\/code><\/pre>\s*$/i, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');

  return unwrapped
    .replace(/^\s*#\s+(?:Varnarc )?Disclaimer\s*\n+/i, '')
    .replace(/^\s*<h1[^>]*>\s*(?:Varnarc )?Disclaimer\s*<\/h1>\s*/i, '')
    .trim();
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await fetchPageBySlug('disclaimer');
    const metadata = await buildSeoMetadata({
      entityType: 'page',
      entityId: data.id,
      path: '/disclaimer',
      canonicalUrl: '/disclaimer',
      title: data.seo?.title || data.title,
      description: data.seo?.description || legalContent.disclaimer.description,
    });
    return {
      ...metadata,
      title: { absolute: data.seo?.title || data.title },
    };
  } catch {
    return fallbackMetadata;
  }
}

export default async function DisclaimerPage() {
  try {
    const { data } = await fetchPageBySlug('disclaimer');
    return (
      <>
        <RecordContentView
          entityType="page"
          entityId={data.id}
          metadata={{ slug: 'disclaimer', title: data.title }}
        />
        <ContentLayout
          title={data.title}
          description={data.seo?.description || undefined}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Disclaimer' }]}
          showAd={false}
        >
          <div className="max-w-4xl">
            <MarkdownContent content={normalizeDisclaimerContent(data.content || '')} />
          </div>
        </ContentLayout>
      </>
    );
  } catch {
    // Keep the legal page available if the CMS API is temporarily unavailable.
  }

  const { title, description, sections } = legalContent.disclaimer;
  return (
    <LegalPage
      title={title}
      description={description}
      sections={sections}
      breadcrumbLabel="Disclaimer"
    />
  );
}
