import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CarLoanDecisionProvider } from '@/components/loans/car-loan-decision-context';
import { CarLoanAffordability } from '@/components/loans/car-loan-affordability';
import { LoanDisclaimer } from '@/components/loans/loan-disclaimer';

export const metadata: Metadata = {
  title: 'Car Loan Affordability Calculator | Varnarc',
  description:
    'Estimate an illustrative car budget from income, existing EMIs and down payment capacity. Not a lender approval.',
  alternates: { canonical: '/calculators/car-loan-affordability' },
};

export default function CarLoanAffordabilityCalculatorPage() {
  return (
    <main className="cl-page w-full bg-[var(--cl-surface-2,#f4f6f9)]">
      <div className="site-container px-4 py-8 sm:py-10">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Calculators', href: '/calculators' },
            { label: 'Car Loan Affordability' },
          ]}
        />
        <div className="mt-6">
          <CarLoanDecisionProvider>
            <CarLoanAffordability standalone />
          </CarLoanDecisionProvider>
        </div>
        <p className="mt-6 text-sm text-slate-600">
          Continue on the{' '}
          <Link
            href="/finance/loans/car-loan"
            className="font-semibold text-[var(--cl-navy,#0b1f3a)] underline-offset-2 hover:text-[var(--cl-orange,#f97316)] hover:underline"
          >
            Car Loan planner
          </Link>{' '}
          to compare offers, new vs used financing and bank vs dealer options.
        </p>
        <div className="mt-8">
          <LoanDisclaimer />
        </div>
      </div>
    </main>
  );
}
