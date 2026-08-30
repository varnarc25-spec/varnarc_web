import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { fetchConstructionFaqs } from '@/services/construction';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';

export async function generateMetadata(): Promise<Metadata> {
  return buildConstructionPageMetadata('faqs');
}

export const revalidate = 60;

export default async function ConstructionFaqsPage() {
  const { data } = await fetchConstructionFaqs();
  const defaults = CONSTRUCTION_PAGE_DEFAULTS.faqs;
  const faqs = data.map((faq) => ({ question: faq.question, answer: faq.answer }));

  return (
    <ContentLayout
      title={defaults.h1}
      description={defaults.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'FAQs' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: 'FAQs', path: '/construction/faqs' }])}
        webPage={{
          name: defaults.title,
          description: defaults.description,
          path: '/construction/faqs',
        }}
        faqs={faqs}
      />

      {faqs.length ? (
        <div className="space-y-3">
          {data.map((faq) => (
            <details
              key={faq.id}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm open:shadow"
            >
              <summary className="cursor-pointer list-none font-semibold text-[#0b1f3a] marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  <span>{faq.question}</span>
                  <span className="text-[#f97316] transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{faq.answer}</p>
            </details>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No FAQs yet"
          message="Construction FAQs will appear here once published."
        />
      )}
    </ContentLayout>
  );
}
