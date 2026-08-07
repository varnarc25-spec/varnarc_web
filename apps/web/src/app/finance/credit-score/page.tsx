import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { CreditScoreCheckForm } from '@/components/finance/finance-forms-client';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('credit-score');
}

export default async function FinanceCreditScorePage() {
  const page = await getFinancePageContent('credit-score');

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Credit score' },
      ]}
    >
      <CreditScoreCheckForm />
    </ContentLayout>
  );
}
