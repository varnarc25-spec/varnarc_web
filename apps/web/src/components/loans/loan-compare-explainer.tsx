import Link from 'next/link';
import {
  CalendarRange,
  CircleDollarSign,
  Percent,
  Receipt,
  Undo2,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

const COMPARE_FACTORS: Array<{
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    id: 'interest-rate',
    title: 'Interest Rate',
    body: 'The nominal or headline rate is only a starting point. Fixed vs floating, resetting periods, and how interest is calculated can change what you actually pay.',
    icon: Percent,
  },
  {
    id: 'total-repayment',
    title: 'Total Repayment',
    body: 'Overall borrowing cost — principal plus interest (and often fees) — shows the real price of the loan over the full tenure, not just the monthly EMI.',
    icon: CircleDollarSign,
  },
  {
    id: 'processing-fees',
    title: 'Processing Fees',
    body: 'Upfront charges reduce the net amount you receive or add to what you repay. Ask how fees are calculated and whether GST or other costs apply.',
    icon: Receipt,
  },
  {
    id: 'loan-tenure',
    title: 'Loan Tenure',
    body: 'A longer tenure can lower EMI but often increases lifetime interest. Match tenure to cash flow and how long you expect to keep the loan.',
    icon: CalendarRange,
  },
  {
    id: 'prepayment-rules',
    title: 'Prepayment Rules',
    body: 'Part-payment and foreclosure terms vary by product. Check lock-in periods, charges, and whether prepaying shortens tenure or cuts EMI.',
    icon: Undo2,
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    body: 'Income, credit profile, employment type, and lender-specific underwriting all affect approval and pricing. Listed criteria are indicative, not guarantees.',
    icon: UserCheck,
  },
];

export function LoanCompareExplainer() {
  return (
    <section
      id="how-to-compare"
      aria-labelledby="how-to-compare-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 bg-linear-to-br from-[#f8fafc] via-white to-[#fff7ed] px-5 py-5 sm:px-6">
        <h2
          id="how-to-compare-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          How to Compare Loans
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
          Don&apos;t compare only the headline interest rate.
        </p>
      </div>

      <ul className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        {COMPARE_FACTORS.map((factor) => (
          <li key={factor.id}>
            <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-[#f8fafc]/60 p-4 transition hover:border-[#f97316]/50 hover:bg-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4eb] text-[#f97316]">
                <factor.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-[#0b1f3a]">{factor.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600">{factor.body}</p>
            </article>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
        <Link
          href="/finance/compare?type=loans"
          className="inline-flex text-sm font-semibold text-blue-700 hover:underline"
        >
          Open Loan Comparison Tool →
        </Link>
      </div>
    </section>
  );
}
