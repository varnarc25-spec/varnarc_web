/** SEO / FAQs for Community Material Price Reporting. */

export const COMMUNITY_PRICE_FAQS = [
  {
    id: 'faq-promote',
    question: 'Do community reports change Varnarc’s primary market prices?',
    answer:
      'No. Unverified community submissions are never promoted into the primary market price hub. Even verified reports appear only in the separate community aggregate, labelled as community sources.',
  },
  {
    id: 'faq-privacy',
    question: 'Is my identity or invoice visible publicly?',
    answer:
      'No. Contributor identity is never shown on public pages. Invoice proofs are private — only you (or a moderator) can download them. They are never exposed as public URLs.',
  },
  {
    id: 'faq-status',
    question: 'What do pending, verified, rejected and flagged mean?',
    answer:
      'Pending awaits moderation. Verified eligible reports can enter the community aggregate. Rejected reports are excluded. Flagged reports need extra review (e.g. duplicate or outlier signals).',
  },
  {
    id: 'faq-aggregate',
    question: 'What does the public community range show?',
    answer:
      'Observed range, sample size, freshness and source composition from eligible verified reports only. If too few eligible reports exist, Varnarc says so instead of inventing a range.',
  },
];

export const COMMUNITY_PRICE_RELATED = [
  { href: '/construction/prices', label: 'Primary market prices' },
  { href: '/construction/fair-price-checker', label: 'Fair Price Checker' },
  { href: '/construction/price-alerts', label: 'Price alerts' },
  { href: '/construction/cost-index', label: 'Cost index (VCCI)' },
];
