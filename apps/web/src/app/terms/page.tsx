import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { TermsDocument } from '@/components/legal/terms-document';
import { RecordContentView } from '@/components/record-content-view';
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
  return unwrapped
    .replace(/^\s*#\s+(?:Varnarc )?Terms of Service\s*\n+/i, '')
    .replace(/^\s*<h1[^>]*>\s*(?:Varnarc )?Terms of Service\s*<\/h1>\s*/i, '')
    .trim();
}

function extractDocumentDates(content: string) {
  const effectiveDate =
    content.match(/^\s*\*{0,2}Effective date:\*{0,2}\s*(.+?)\s*$/im)?.[1]?.trim() ||
    content
      .match(/<p[^>]*>\s*(?:<strong>)?Effective date:(?:<\/strong>)?\s*(.*?)\s*<\/p>/i)?.[1]
      ?.replace(/<[^>]+>/g, '')
      .trim() ||
    undefined;
  const lastUpdated =
    content.match(/^\s*\*{0,2}Last updated:\*{0,2}\s*(.+?)\s*$/im)?.[1]?.trim() ||
    content
      .match(/<p[^>]*>\s*(?:<strong>)?Last updated:(?:<\/strong>)?\s*(.*?)\s*<\/p>/i)?.[1]
      ?.replace(/<[^>]+>/g, '')
      .trim() ||
    undefined;
  return {
    effectiveDate,
    lastUpdated,
    content: content
      .replace(/^\s*\*{0,2}Effective date:\*{0,2}\s*.+?\s*$/im, '')
      .replace(/^\s*\*{0,2}Last updated:\*{0,2}\s*.+?\s*$/im, '')
      .replace(/<p[^>]*>\s*(?:<strong>)?Effective date:(?:<\/strong>)?\s*.*?\s*<\/p>/i, '')
      .replace(/<p[^>]*>\s*(?:<strong>)?Last updated:(?:<\/strong>)?\s*.*?\s*<\/p>/i, '')
      .trim(),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await fetchPageBySlug('terms-of-service');
    const metadata = await buildSeoMetadata({
      entityType: 'page',
      entityId: data.id,
      path: '/terms',
      canonicalUrl: '/terms',
      title: data.seo?.title || data.title,
      description: data.seo?.description || legalContent.terms.description,
    });
    return {
      ...metadata,
      title: { absolute: data.seo?.title || data.title },
    };
  } catch {
    return fallbackMetadata;
  }
}

export default async function TermsOfServicePage() {
  try {
    const { data } = await fetchPageBySlug('terms-of-service');
    const document = extractDocumentDates(normalizeTermsContent(data.content || ''));
    return (
      <>
        <RecordContentView
          entityType="page"
          entityId={data.id}
          metadata={{ slug: 'terms-of-service', title: data.title }}
        />
        <TermsDocument
          title={data.title}
          description={data.seo?.description || undefined}
          content={document.content}
          effectiveDate={document.effectiveDate}
          lastUpdated={document.lastUpdated}
        />
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
