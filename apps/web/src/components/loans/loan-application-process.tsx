import Link from 'next/link';
import {
  BadgeCheck,
  Building2,
  Calculator,
  ClipboardCheck,
  GitCompareArrows,
  Layers3,
  Send,
  type LucideIcon,
} from 'lucide-react';

const STEPS: Array<{
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    id: 'choose-loan-type',
    title: 'Choose Loan Type',
    body: 'Match the product to your purpose — personal, home, vehicle, education, business, and more.',
    icon: Layers3,
  },
  {
    id: 'compare-lenders',
    title: 'Compare Lenders',
    body: 'Review rate ranges, fees, tenure options, and key terms side by side before shortlisting.',
    icon: GitCompareArrows,
  },
  {
    id: 'estimate-emi',
    title: 'Estimate EMI',
    body: 'Use amount, rate, and tenure to gauge monthly repayment and overall interest cost.',
    icon: Calculator,
  },
  {
    id: 'check-eligibility',
    title: 'Check Eligibility',
    body: 'Look at indicative criteria such as income, credit profile, and employment type.',
    icon: ClipboardCheck,
  },
  {
    id: 'apply-with-lender',
    title: 'Apply With Lender',
    body: 'Submit through the lender’s official channel. Varnarc does not process loan applications.',
    icon: Send,
  },
  {
    id: 'verification',
    title: 'Verification',
    body: 'Lenders typically verify KYC, income, and other documents as part of their process.',
    icon: Building2,
  },
  {
    id: 'approval-disbursement',
    title: 'Approval / Disbursement',
    body: 'If approved, funds are disbursed by the lender per their timelines and terms.',
    icon: BadgeCheck,
  },
];

export function LoanApplicationProcess() {
  return (
    <section id="application-process" aria-labelledby="application-process-heading">
      <div className="max-w-2xl">
        <h2
          id="application-process-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          Loan Application Process
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          A typical path from research to disbursement. Steps and timelines vary by lender and
          product.
        </p>
      </div>

      <ol className="relative mt-5 lg:flex lg:items-stretch lg:gap-0 lg:overflow-x-auto lg:pb-2">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <li
              key={step.id}
              className={`relative flex gap-3 lg:min-w-0 lg:flex-1 lg:flex-col lg:items-center lg:gap-0 lg:px-1.5 ${
                !isLast ? 'pb-6 lg:pb-0' : ''
              }`}
            >
              {!isLast ? (
                <span
                  className="absolute bottom-0 left-[19px] top-10 w-px bg-slate-200 lg:hidden"
                  aria-hidden
                />
              ) : null}

              <div className="relative z-[1] flex shrink-0 flex-col items-center lg:w-full">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0b1f3a] bg-white text-[#0b1f3a]">
                  <step.icon className="h-4 w-4" aria-hidden />
                </span>
                {!isLast ? (
                  <span
                    className="pointer-events-none absolute left-[calc(50%+1.25rem)] top-5 hidden h-0.5 w-[calc(100%-1.25rem)] bg-slate-200 lg:block"
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pt-0.5 lg:mt-3 lg:pt-0 lg:text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#f97316]">
                  Step {index + 1}
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-[#0b1f3a]">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 lg:mx-auto lg:max-w-[11.5rem]">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 space-y-2">
        <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
          Varnarc does not guarantee approval. Final processing, underwriting, and disbursement
          occur with the lender.
        </p>
        <Link
          href="/finance/eligibility"
          className="group inline-flex text-sm font-semibold text-[#0b1f3a] hover:text-[#f97316]"
        >
          Check eligibility tools
          <span
            className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
