import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ContentLayout } from '@/components/layout/content-layout';
import { EligibilityCheckForm } from '@/components/finance/finance-forms-client';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('eligibility');
}

export default async function FinanceEligibilityPage() {
  const page = await getFinancePageContent('eligibility');

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Eligibility' },
      ]}
    >
      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Loading eligibility check…
          </div>
        }
      >
        <EligibilityCheckForm />
      </Suspense>
    </ContentLayout>
  );
}
