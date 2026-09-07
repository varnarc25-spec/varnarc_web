'use client';

import { Suspense } from 'react';
import type { ArticleWidgetId } from '@varnarc/validation';
import { LoanEmiCalculator } from '@/components/loans/loan-emi-calculator';

function WidgetFallback() {
  return <div className="article-block">Loading calculator…</div>;
}

export function ArticleWidgetRenderer({ widget }: { widget: ArticleWidgetId }) {
  return (
    <Suspense fallback={<WidgetFallback />}>
      <WidgetInner widget={widget} />
    </Suspense>
  );
}

function WidgetInner({ widget }: { widget: ArticleWidgetId }) {
  switch (widget) {
    case 'personal-loan-emi':
      return (
        <LoanEmiCalculator
          title="Personal Loan EMI Calculator"
          eyebrow="Personal loan"
          description="Estimate a personal loan EMI before you compare offers. Figures are illustrative."
        />
      );
    case 'home-loan-emi':
      return (
        <LoanEmiCalculator
          title="Home Loan EMI Calculator"
          eyebrow="Home loan"
          description="Estimate a home loan EMI. Figures are illustrative, not an offer."
        />
      );
    case 'car-loan-emi':
      return (
        <LoanEmiCalculator
          title="Car Loan EMI Calculator"
          eyebrow="Car loan"
          description="Estimate a car loan EMI. Figures are illustrative, not an offer."
        />
      );
    case 'loan-eligibility':
      return (
        <LoanEmiCalculator
          title="Loan eligibility estimate"
          eyebrow="Eligibility"
          description="Use EMI as a starting point for affordability. This is not a lender eligibility decision."
        />
      );
    default:
      return null;
  }
}
