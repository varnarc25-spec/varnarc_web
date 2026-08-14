import { Calculator, FileCheck2, Scale, ShieldAlert, type LucideIcon } from 'lucide-react';
import { financeMethodologyPath } from '@/lib/finance-routes';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';

const ITEMS: Array<{
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    id: 'clear-comparisons',
    title: 'Clear comparisons',
    body: 'Rates, fees, tenure and repayment details are shown together so you can compare products side by side.',
    icon: Scale,
  },
  {
    id: 'rate-verification',
    title: 'Rate verification dates',
    body: 'Where available, loan cards show when rates were last verified so freshness is visible.',
    icon: FileCheck2,
  },
  {
    id: 'useful-calculators',
    title: 'Useful calculators',
    body: 'Estimate EMI and repayment before shortlisting — illustrative only, not a lender offer.',
    icon: Calculator,
  },
  {
    id: 'no-guaranteed-approval',
    title: 'No guaranteed approval claims',
    body: 'Lenders make final approval decisions. Varnarc does not promise eligibility or disbursal.',
    icon: ShieldAlert,
  },
];

export function LoanTrustMethodologySection() {
  return (
    <section id="compare-with-clearer-information" aria-labelledby="trust-methodology-heading">
      <LoanSectionHeader
        id="trust-methodology-heading"
        title="How Varnarc presents loan information"
        description="Informational principles — not a lending offer or marketing claim."
        action={{
          href: financeMethodologyPath(),
          label: 'How Varnarc compares loans →',
        }}
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8eef5] text-[#0b1f3a]">
              <item.icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#0b1f3a]">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
