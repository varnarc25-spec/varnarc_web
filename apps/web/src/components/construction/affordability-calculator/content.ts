/** SEO / education copy for Construction Affordability Calculator. */

export const AFFORD_CALC_FAQS = [
  {
    id: 'faq-not-advice',
    question: 'Is this personalized financial advice?',
    answer:
      'No. The Construction Affordability Calculator is an educational planning tool. It does not assess creditworthiness, recommend loans, or replace advice from a qualified advisor or your bank.',
  },
  {
    id: 'faq-what-gap',
    question: 'What does a funding gap mean?',
    answer:
      'A gap means available savings plus your expected loan are less than the project cost plus the contingency reserve you chose. Options include reducing scope, changing finish quality, raising funds, or adjusting the timeline — always verify with professionals.',
  },
  {
    id: 'faq-contingency',
    question: 'Why hold a contingency reserve on top of the estimate?',
    answer:
      'Estimates often already include some contingency, but renovations and builds frequently uncover extra work. Holding an additional reserve reduces the chance of stopping mid-project when costs rise.',
  },
  {
    id: 'faq-peak-cash',
    question: 'Why is peak cash higher than the monthly average?',
    answer:
      'Foundation and structure phases often need larger outflows than a flat monthly average. The peak figure is an indicative uplift for planning liquidity — not a contractor payment schedule.',
  },
  {
    id: 'faq-emi',
    question: 'What does the EMI-to-income figure mean?',
    answer:
      'If you enter income and EMI, we show EMI as a percentage of income for information only. Lenders use their own FOIR and eligibility rules; this ratio is not an approval or rejection signal.',
  },
  {
    id: 'faq-link-calc',
    question: 'Can I use a Varnarc cost estimate as the project cost?',
    answer:
      'Yes. Paste the estimated total from the Construction Cost Calculator or open this page with a projectCost query parameter. You can also start from a saved construction project and refine numbers here.',
  },
];

export const AFFORD_CALC_RELATED = [
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/renovation-cost-calculator', label: 'Renovation cost calculator' },
  { href: '/construction/estimate', label: 'Quick cost estimator' },
  { href: '/construction/planner', label: 'Project planner' },
  { href: '/construction/projects', label: 'Saved projects' },
  { href: '/finance/loans/home-loan', label: 'Home loan guides' },
];

export const AFFORD_SEO_INTRO = `Construction affordability is about whether your planned build or renovation budget fits the money you can put toward it — savings, expected loan, and a contingency buffer — over the months of construction. Use this calculator to spot a surplus or gap early, then adjust scope, quality or funding before you commit.`;
