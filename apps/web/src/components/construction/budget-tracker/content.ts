/** SEO / FAQs for Construction Project Budget Tracker. */

export const BUDGET_TRACKER_FAQS = [
  {
    id: 'faq-committed',
    question: 'What is the difference between spent and committed?',
    answer:
      'Spent includes expenses marked Paid. Committed includes Pending, Committed and Partial payment statuses — money allocated but not fully paid yet. Remaining = Total budget − Spent − Committed.',
  },
  {
    id: 'faq-categories',
    question: 'Which categories can I use?',
    answer:
      'Budget categories map to Varnarc BOQ categories (RCC, Masonry, Electrical, etc.) plus Contingency, Professional fees, Labour, Equipment and Permits. Use Other when nothing fits.',
  },
  {
    id: 'faq-precision',
    question: 'How are currency amounts calculated?',
    answer:
      'Totals use integer minor units (e.g. paise) for precise decimal arithmetic, then convert back to major units for display. This avoids floating-point drift when summing many lines.',
  },
  {
    id: 'faq-save',
    question: 'Does this replace my accounting software?',
    answer:
      'No. This is a project planning tracker. Figures are based on amounts you enter and are not audited accounts or tax records.',
  },
];

export const BUDGET_TRACKER_RELATED = [
  { href: '/construction/boq-generator', label: 'BOQ Generator' },
  { href: '/construction/timeline-planner', label: 'Timeline planner' },
  { href: '/construction/cost-calculator', label: 'Cost calculator' },
  { href: '/construction/project/new', label: 'Create project' },
];

export const BUDGET_TRACKER_SEO = `Track construction project budget vs actual spend with category lines, expenses, committed costs and remaining budget. Charts for budget vs actual and cumulative spending. Precise decimal money math. Planning tracker only — not audited accounts.`;
