import Link from 'next/link';
import { formatInr } from '@/components/loans/loan-format';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';
import { buildPersonalLoanEmiExampleRows, PERSONAL_LOAN_EMI_TABLE } from '@/lib/personal-loan-page';

export function PersonalLoanEmiExampleTable() {
  const rows = buildPersonalLoanEmiExampleRows();
  if (!rows.length) return null;

  return (
    <section
      id="personal-loan-emi-examples"
      aria-labelledby="personal-loan-emi-examples-heading"
      className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]"
    >
      <div className="site-container px-4 py-10 sm:py-12">
        <LoanSectionHeader
          id="personal-loan-emi-examples-heading"
          eyebrow="Illustrative examples"
          title="Personal loan EMI example table"
          description={PERSONAL_LOAN_EMI_TABLE.disclaimer}
        />

        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200/80">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[#0b1f3a] text-white">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Loan amount
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Monthly EMI
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Total interest
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Total repayment
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.amount} className="border-t border-slate-200/80 odd:bg-[#f8fafc]">
                  <th scope="row" className="px-4 py-3 font-semibold tabular-nums text-[#0b1f3a]">
                    {formatInr(row.amount)}
                  </th>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatInr(row.result.monthlyEmi)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatInr(row.result.totalInterest)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatInr(row.result.totalRepayment)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Assumptions: {PERSONAL_LOAN_EMI_TABLE.ratePercent}% p.a. ·{' '}
          {PERSONAL_LOAN_EMI_TABLE.tenureMonths} months · reducing-balance EMI.
        </p>
      </div>
    </section>
  );
}

export function PersonalLoanFeesSection({
  loans,
}: {
  loans: Array<{
    id: string;
    name: string;
    bank?: { name?: string | null } | null;
    processingFee?: number | string | null;
    processingFeeMin?: number | string | null;
    processingFeeMax?: number | string | null;
    processingFeeText?: string | null;
  }>;
}) {
  const withFees = loans
    .map((loan) => {
      const fee =
        formatInr(loan.processingFee) ||
        (loan.processingFeeMin != null || loan.processingFeeMax != null
          ? `${formatInr(loan.processingFeeMin) ?? '—'} – ${formatInr(loan.processingFeeMax) ?? '—'}`
          : null) ||
        loan.processingFeeText?.trim() ||
        null;
      return { ...loan, feeLabel: fee };
    })
    .filter((loan) => loan.feeLabel)
    .slice(0, 6);

  return (
    <section
      id="personal-loan-fees"
      aria-labelledby="personal-loan-fees-heading"
      className="full-bleed bg-white"
    >
      <div className="site-container px-4 py-10 sm:py-12">
        <LoanSectionHeader
          id="personal-loan-fees-heading"
          eyebrow="Cost beyond interest"
          title="Personal loan fees & charges"
          description="Compare fee types carefully. Missing values mean the fee is not verified on this listing — confirm with the lender."
        />

        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Processing fee', 'Often flat or % of amount; GST may apply.'],
            ['Late payment fee', 'Charged if an EMI is delayed.'],
            ['Prepayment fee', 'May apply on part-prepayment after lock-in.'],
            ['Foreclosure fee', 'May apply on early closure.'],
            ['Documentation / admin', 'Check sanction letter for extras.'],
          ].map(([title, detail]) => (
            <li
              key={title}
              className="rounded-xl bg-[#f8fafc] px-4 py-3.5 ring-1 ring-slate-200/70"
            >
              <p className="text-sm font-bold text-[#0b1f3a]">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{detail}</p>
            </li>
          ))}
        </ul>

        {withFees.length ? (
          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-slate-200/80">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Processing fee comparison for listed personal loan products
              </caption>
              <thead className="bg-[#0b1f3a] text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Lender
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Processing fee (listed)
                  </th>
                </tr>
              </thead>
              <tbody>
                {withFees.map((loan) => (
                  <tr key={loan.id} className="border-t border-slate-200/80 odd:bg-[#f8fafc]">
                    <th scope="row" className="px-4 py-3 font-semibold text-[#0b1f3a]">
                      <Link
                        href={`/finance/loans/${loan.id}`}
                        className="hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
                      >
                        {loan.name}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-slate-600">{loan.bank?.name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{loan.feeLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-600">
            Verified processing-fee data is not available on current listings. Confirm fees in each
            product’s sanction terms.
          </p>
        )}
      </div>
    </section>
  );
}
