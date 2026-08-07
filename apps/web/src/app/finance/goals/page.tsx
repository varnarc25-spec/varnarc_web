import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceGoalCreateForm } from '@/components/finance/finance-forms-client';
import { fetchFinanceGoals } from '@/services/finance';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('goals');
}

export const revalidate = 60;

export default async function FinanceGoalsPage() {
  const [page, { data }] = await Promise.all([getFinancePageContent('goals'), fetchFinanceGoals()]);

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Goals' },
      ]}
    >
      <FinanceGoalCreateForm />

      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((goal) => (
            <div
              key={goal.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-extrabold text-[#0b1f3a]">{goal.name}</h2>
              {goal.category ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#f97316]">
                  {goal.category}
                </p>
              ) : null}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-slate-500">Target</dt>
                  <dd className="font-semibold text-[#0b1f3a]">
                    {goal.targetAmount != null ? `₹${goal.targetAmount}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Saved</dt>
                  <dd className="font-semibold text-[#0b1f3a]">
                    {goal.currentAmount != null ? `₹${goal.currentAmount}` : '—'}
                  </dd>
                </div>
                {goal.targetDate ? (
                  <div className="col-span-2">
                    <dt className="text-slate-500">Target date</dt>
                    <dd>{new Date(goal.targetDate).toLocaleDateString()}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No goals yet" message="Create your first financial goal above." />
      )}
    </ContentLayout>
  );
}
