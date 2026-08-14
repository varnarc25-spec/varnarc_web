import Link from 'next/link';
import { Anchor, Waves } from 'lucide-react';

export function LoanFixedFloatingSection() {
  return (
    <section
      id="fixed-vs-floating"
      aria-labelledby="fixed-vs-floating-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 bg-linear-to-br from-[#f8fafc] via-white to-[#fff7ed] px-5 py-5 sm:px-6">
        <h2
          id="fixed-vs-floating-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          Fixed vs Floating Interest Rates
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
          Rate structures differ by product and lender. Review the applicable period, reset rules,
          and how EMI or tenure can change before you decide.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-[#f8fafc]/70 p-4 sm:p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eef5] text-[#0b1f3a]">
            <Anchor className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="mt-3 text-base font-extrabold text-[#0b1f3a]">Fixed Rate</h3>
          <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b1f3a]" aria-hidden />
              <span>
                The interest rate remains fixed for the applicable period according to the loan
                terms — confirm how long that period lasts and what happens afterward.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b1f3a]" aria-hidden />
              <span>
                Payments may be more predictable during the fixed period, which some borrowers
                prefer for budgeting.
              </span>
            </li>
          </ul>
        </article>

        <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-[#f8fafc]/70 p-4 sm:p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4eb] text-[#f97316]">
            <Waves className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="mt-3 text-base font-extrabold text-[#0b1f3a]">Floating Rate</h3>
          <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]" aria-hidden />
              <span>
                The rate can change based on lender or benchmark rules (for example, linked
                reference rates and reset schedules).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]" aria-hidden />
              <span>
                When the rate moves, EMI or tenure may change depending on how the lender applies
                the reset to your loan.
              </span>
            </li>
          </ul>
        </article>
      </div>

      <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
        <h3 className="text-sm font-extrabold text-[#0b1f3a]">Which one should you choose?</h3>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-600">
          There is no universal recommendation. Suitability depends on loan type, tenure, your view
          of the rate outlook, the lender&apos;s specific terms (including fixed-period length and
          reset rules), and how much you value payment predictability.
        </p>
        <p className="mt-4">
          <Link
            href="/finance/rates"
            className="inline-flex text-sm font-semibold text-blue-700 hover:underline"
          >
            Interest Rate Guide →
          </Link>
        </p>
      </div>
    </section>
  );
}
