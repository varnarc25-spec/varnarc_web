import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { BudgetTrackerClient } from '@/components/construction/budget-tracker/budget-tracker-client';
import { BUDGET_TRACKER_FAQS } from '@/components/construction/budget-tracker/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('budget-tracker', { searchParams: params });
}

export default async function BudgetTrackerPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Budget tracker', path: '/construction/budget-tracker' },
        ])}
        webApplication={{
          name: 'Varnarc Construction Project Budget Tracker',
          description:
            'Track budget categories, actual expenses, committed costs and remaining budget with charts. Precise decimal money math. Planning tracker only.',
          path: '/construction/budget-tracker',
        }}
        faqs={BUDGET_TRACKER_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <Suspense
        fallback={
          <div className="site-container py-10 text-sm text-slate-500">Loading budget tracker…</div>
        }
      >
        <BudgetTrackerClient />
      </Suspense>
    </>
  );
}
