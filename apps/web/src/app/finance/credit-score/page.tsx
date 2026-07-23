import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { CreditScoreCheckForm } from '@/components/finance/finance-forms-client';

export const metadata: Metadata = {
  title: 'Credit Score Check',
  description: 'Check your credit score (mock integration).',
  alternates: { canonical: '/finance/credit-score' },
};

export default function FinanceCreditScorePage() {
  return (
    <ContentLayout
      title="Credit score"
      description="Estimate your credit profile. Full bureau integration coming soon."
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
