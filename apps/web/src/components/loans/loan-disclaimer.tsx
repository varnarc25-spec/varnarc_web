export function LoanDisclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 ${className}`}
      role="note"
      aria-label="Loan information disclaimer"
    >
      <p>
        Interest rates, fees, loan amounts and eligibility criteria shown on Varnarc are for
        informational purposes and may change. Actual terms depend on the lender and applicant
        profile. Verify the latest terms with the lender before making a financial decision.
      </p>
      <p className="mt-2">
        Rates and eligibility depend on applicant profile and lender policies. Verify final terms
        with the lender before applying.
      </p>
    </aside>
  );
}

export function LoanSponsoredDisclosure({ text }: { text?: string | null }) {
  return (
    <p className="text-xs leading-snug text-amber-800">
      {text?.trim() ||
        'Sponsored listing. This does not change the factual rate or fee information shown.'}
    </p>
  );
}
