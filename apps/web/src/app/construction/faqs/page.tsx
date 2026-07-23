import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchConstructionFaqs } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction FAQs',
  description: 'Frequently asked questions about materials, costs, and home construction.',
  alternates: { canonical: '/construction/faqs' },
};

export const revalidate = 60;

export default async function ConstructionFaqsPage() {
  const { data } = await fetchConstructionFaqs();

  const jsonLd = data.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null;

  return (
    <ContentLayout
      title="Construction FAQs"
      description="Answers to common questions about building materials and project planning."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'FAQs' },
      ]}
    >
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}

      {data.length ? (
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
        <EmptyState title="No FAQs yet" message="Construction FAQs will appear here once published." />
      )}
    </ContentLayout>
  );
}
