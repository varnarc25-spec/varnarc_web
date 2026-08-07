import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchFinanceGlossary } from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('glossary');
}

export const revalidate = 60;

export default async function FinanceGlossaryPage() {
  const [page, { data }] = await Promise.all([
    getFinancePageContent('glossary'),
    fetchFinanceGlossary(),
  ]);
  const sorted = [...data].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Glossary' },
      ]}
    >
      {sorted.length ? (
        <dl className="space-y-4">
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <dt className="font-extrabold text-[#0b1f3a]">{entry.term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-700">{entry.definition}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState
          title="No glossary terms yet"
          message="Glossary entries will appear here once published."
        />
      )}
    </ContentLayout>
  );
}
