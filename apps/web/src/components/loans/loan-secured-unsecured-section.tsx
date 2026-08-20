import Link from 'next/link';

const ROWS: Array<{
  label: string;
  secured: string;
  unsecured: string;
}> = [
  {
    label: 'Collateral',
    secured:
      'Backed by an asset such as property, gold, or another lender-accepted security — depending on the product.',
    unsecured: 'No asset pledge in the usual sense; approval leans more on profile and capacity.',
  },
  {
    label: 'Typical lender risk',
    secured:
      'The pledged asset can reduce lender risk if terms allow recovery, but risk still depends on valuation and product rules.',
    unsecured:
      'Generally based more heavily on income, credit profile, and repayment capacity without collateral backup.',
  },
  {
    label: 'Potential interest characteristics',
    secured:
      'May have lower rates depending on lender and borrower profile — not always, and not for every product.',
    unsecured:
      'Rates can be higher for some products because there is no collateral buffer; pricing still varies widely.',
  },
  {
    label: 'Loan amount',
    secured:
      'Often linked to asset value or loan-to-value limits set by the lender for that product.',
    unsecured:
      'Usually capped by income multiples, credit assessment, and the lender’s product limits.',
  },
  {
    label: 'Approval assessment',
    secured:
      'Underwriting typically reviews the asset plus eligibility factors such as income and credit history.',
    unsecured:
      'Assessment focuses more on credit, income stability, existing obligations, and lender-specific criteria.',
  },
  {
    label: 'Examples',
    secured: 'Gold loan, home loan, loan against property, and similar asset-backed products.',
    unsecured: 'Personal loans and many other credit facilities without pledged collateral.',
  },
  {
    label: 'Main borrower consideration',
    secured:
      'You may risk the pledged asset if you default — understand valuation, charges, and foreclosure terms.',
    unsecured:
      'Without collateral, affordability and total cost matter more; missed payments can still affect credit history.',
  },
];

export function LoanSecuredUnsecuredSection() {
  return (
    <section
      id="secured-vs-unsecured"
      aria-labelledby="secured-vs-unsecured-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 bg-linear-to-br from-[#f8fafc] via-white to-[#fff7ed] px-5 py-5 sm:px-6">
        <h2
          id="secured-vs-unsecured-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
        >
          Secured vs Unsecured Loans
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
          A quick comparison of how these structures typically differ. Exact terms always depend on
          the lender and product.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {/* Desktop / tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Comparison of secured loans and unsecured loans across collateral, lender risk,
              interest characteristics, loan amount, approval assessment, examples, and main
              borrower considerations.
            </caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th
                  scope="col"
                  className="w-[22%] px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Factor
                </th>
                <th scope="col" className="w-[39%] px-3 py-3 text-sm font-extrabold text-[#0b1f3a]">
                  Secured Loan
                </th>
                <th scope="col" className="w-[39%] px-3 py-3 text-sm font-extrabold text-[#0b1f3a]">
                  Unsecured Loan
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, index) => (
                <tr key={row.label} className={index % 2 === 0 ? 'bg-[#f8fafc]/80' : 'bg-white'}>
                  <th
                    scope="row"
                    className="px-3 py-3.5 align-top text-xs font-extrabold text-[#0b1f3a]"
                  >
                    {row.label}
                  </th>
                  <td className="px-3 py-3.5 align-top text-xs leading-relaxed text-slate-600">
                    {row.secured}
                  </td>
                  <td className="px-3 py-3.5 align-top text-xs leading-relaxed text-slate-600">
                    {row.unsecured}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards (same content, accessible) */}
        <ul className="space-y-3 md:hidden">
          {ROWS.map((row) => (
            <li
              key={row.label}
              className="rounded-xl border border-slate-200 bg-[#f8fafc]/60 p-3.5"
            >
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">{row.label}</h3>
              <dl className="mt-2.5 space-y-2.5">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#f97316]">
                    Secured Loan
                  </dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{row.secured}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">
                    Unsecured Loan
                  </dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{row.unsecured}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Secured loans may have lower rates depending on lender and borrower profile — they do not
          always cost less than unsecured options.
        </p>
      </div>

      <nav
        aria-label="Related loan categories"
        className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 sm:px-6"
      >
        <Link
          href="/finance/loans/gold-loan"
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#0b1f3a] hover:border-[#f97316] hover:text-[#f97316]"
        >
          Gold Loan
        </Link>
        <Link
          href="/finance/loans/loan-against-property"
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#0b1f3a] hover:border-[#f97316] hover:text-[#f97316]"
        >
          Loan Against Property
        </Link>
        <Link
          href="/finance/loans/personal-loan"
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#0b1f3a] hover:border-[#f97316] hover:text-[#f97316]"
        >
          Personal Loan
        </Link>
      </nav>
    </section>
  );
}
