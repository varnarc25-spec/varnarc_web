import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchFinanceGlossary } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Finance Glossary',
  description: 'Definitions of common financial terms and concepts.',
  alternates: { canonical: '/finance/glossary' },
};

export const revalidate = 60;

export default async function FinanceGlossaryPage() {
  const { data } = await fetchFinanceGlossary();
  const sorted = [...data].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <ContentLayout
      title="Finance glossary"
      description="Plain-language definitions for banking, investing, and insurance terms."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Glossary' },
      ]}
    >
      {sorted.length ? (
        <dl className="space-y-4">
          {sorted.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <dt className="font-extrabold text-[#0b1f3a]">{entry.term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-700">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState title="No glossary terms yet" message="Glossary entries will appear here once published." />
      )}
    </ContentLayout>
  );
}
