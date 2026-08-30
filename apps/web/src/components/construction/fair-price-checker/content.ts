/** SEO / FAQs for Fair Price Checker. */

export const FAIR_PRICE_FAQS = [
  {
    id: 'faq-what',
    question: 'What does the Fair Price Checker do?',
    answer:
      'It compares a supplier quote with Varnarc’s recent observed/reference prices for the same material, location and unit. It shows whether the quote sits within, below or above that observed range — not whether the quote is fair or unfair.',
  },
  {
    id: 'faq-unfair',
    question: 'Does a result mean my quote is unfair?',
    answer:
      'No. Varnarc never labels a quote as unfair or fraudulent. Differences can come from brand, grade, GST, delivery, quantity and negotiation. Always verify with local dealers.',
  },
  {
    id: 'faq-data',
    question: 'What if there is not enough data?',
    answer:
      'If too few recent LIVE or VERIFIED observations exist for that material, location and unit, the tool says so and does not invent a range or classification.',
  },
  {
    id: 'faq-quantity',
    question: 'What is project cost impact?',
    answer:
      'If you enter a required quantity, Varnarc scales the quoted unit price and the observed range to totals so you can see the project-level difference versus the mid of the observed range.',
  },
];

export const FAIR_PRICE_RELATED = [
  { href: '/construction/prices', label: 'Construction prices' },
  { href: '/construction/price-position', label: 'Price position' },
  { href: '/construction/community-prices', label: 'Community prices' },
  { href: '/construction/price-alerts', label: 'Price alerts' },
  { href: '/construction/cost-index', label: 'Cost index (VCCI)' },
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
];
