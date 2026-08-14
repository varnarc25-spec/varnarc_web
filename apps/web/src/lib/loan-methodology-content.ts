/** Body copy for /finance/loans/methodology — claims match current product behavior only. */

export const LOAN_METHODOLOGY_SECTIONS = [
  {
    id: 'where-loan-data-comes-from',
    heading: 'Where Loan Data Comes From',
    body: 'Loan products on Varnarc are stored in our database and managed through the admin CMS. Each listing is linked to a lender (bank) record and may include a loan category, published status, and product fields such as interest ranges, fees, tenure, amounts, eligibility notes, and features. Only published loans appear on the public Loans hub. We do not hardcode bank rates into page templates.',
  },
  {
    id: 'how-interest-rates-are-displayed',
    heading: 'How Interest Rates Are Displayed',
    body: 'Rates come from fields on each loan record (including optional minimum and maximum values). The public UI formats those values for display — for example as a single rate, a published range, a floor rate labeled “From,” or “Rate on request” when no rate is stored. Varnarc does not invent missing rates. Where a last-verified date is stored, loan cards can show it as “Rates verified” with that date; otherwise the card may show that verification is pending.',
  },
  {
    id: 'what-starting-from-means',
    heading: 'What "Starting From" Means',
    body: 'When a loan has only a minimum (floor) rate published, the listing may use wording such as “From 9.10% p.a.” That means the figure is a published starting or indicative rate from the product record, not a guarantee of the rate you will receive. When both minimum and maximum rates are stored, the UI shows the range. Your offered rate depends on the lender’s assessment of your profile and current policies.',
  },
  {
    id: 'how-often-loan-information-is-reviewed',
    heading: 'How Often Loan Information Is Reviewed',
    body: 'Loan records can store a last-verified date and a “needs rate review” flag for editorial use. There is no automated schedule that re-checks lender websites on a fixed cadence. Freshness depends on when editors update the product in the CMS. Always confirm current terms with the lender before you apply.',
  },
  {
    id: 'how-fees-and-eligibility-are-presented',
    heading: 'How Fees and Eligibility Are Presented',
    body: 'Processing fees may appear as a text note or as percentage fields on the loan card when those values exist. Other charge notes (such as foreclosure or prepayment text) may be stored on the product for detail pages when editors add them. Eligibility may appear as summary text on the product detail page, and some cards show a minimum credit score when that field is set. Separate tools (such as the eligibility check and EMI calculators) produce illustrative estimates from the inputs you enter — they are not lender decisions.',
  },
  {
    id: 'what-featured-means',
    heading: 'What "Featured" Means',
    body: '“Featured” is an editorial placement flag set on a loan in the CMS. Featured products can appear in a dedicated strip on the Loans hub and rank higher under the default Recommended sort. Featured does not mean Varnarc has certified the loan as the best option, cheapest product, or most suitable choice for you.',
  },
  {
    id: 'sponsored-and-affiliate-relationships',
    heading: 'Sponsored and Affiliate Relationships',
    body: 'A loan may be marked sponsored and can show a sponsored disclosure on the card. Some products include an affiliate or apply link that opens the lender or partner site (labeled as leaving Varnarc where that pattern is used). Sponsored or affiliate placement can affect visibility — for example, Recommended sort prefers featured products, then sponsored ones, then more recently updated listings — but it does not change the rate or fee figures stored on the product. See also our site disclaimer for affiliate and advertising wording.',
  },
  {
    id: 'how-loan-comparison-sorting-works',
    heading: 'How Loan Comparison Sorting Works',
    body: 'On the Loans listing you can sort by Recommended (featured first, then sponsored, then most recently updated), Lowest Interest Rate, Highest Loan Amount, Lowest Processing Fee, or Longest Tenure. Side-by-side compare uses the products you select via the Compare checkbox and shows shared fields such as interest rate, amount, and tenure. Varnarc does not auto-label a single winning loan from that comparison.',
  },
  {
    id: 'why-your-final-rate-may-differ',
    heading: 'Why Your Final Rate May Differ',
    body: 'Published rates and ranges are informational snapshots from the product record. Lenders set the final rate and terms based on credit profile, income, employment, existing obligations, product rules, and current offers. Fees, tenure, and eligibility can also differ from what you see on Varnarc. Always verify the sanction letter or offer with the lender.',
  },
  {
    id: 'how-to-report-incorrect-information',
    heading: 'How to Report Incorrect Information',
    body: 'If you spot outdated or incorrect loan information, use the Contact page to tell us which product and what looks wrong. We use those reports to help editors review the CMS record. Reporting an issue does not change your application status with any lender.',
  },
] as const;
