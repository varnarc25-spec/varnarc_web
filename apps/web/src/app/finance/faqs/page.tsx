import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchFinanceFaqs } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Finance FAQs',
  description: 'Frequently asked questions about loans, cards, insurance, and investments.',
  alternates: { canonical: '/finance/faqs' },
};

export const revalidate = 60;

export default async function FinanceFaqsPage() {
  const { data } = await fetchFinanceFaqs();

  return (
    <ContentLayout
      title="Finance FAQs"
      description="Answers to common questions about financial products and planning."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'FAQs' },
      ]}
    >
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
        <EmptyState title="No FAQs yet" message="Finance FAQs will appear here once published." />
      )}
    </ContentLayout>
  );
}
