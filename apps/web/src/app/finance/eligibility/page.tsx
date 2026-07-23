import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EligibilityCheckForm } from '@/components/finance/finance-forms-client';

export const metadata: Metadata = {
  title: 'Loan Eligibility',
  description: 'Check your loan eligibility based on income and requested amount.',
  alternates: { canonical: '/finance/eligibility' },
};

export default function FinanceEligibilityPage() {
  return (
    <ContentLayout
      title="Loan eligibility"
      description="Quick eligibility check for personal, home, car, and business loans."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Eligibility' },
      ]}
    >
      <EligibilityCheckForm />
    </ContentLayout>
  );
}
