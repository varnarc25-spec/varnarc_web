export const PRICE_POSITION_FAQS = [
  {
    id: 'faq-what',
    question: 'What is Material Price Position?',
    answer:
      'It shows where the latest Varnarc observation sits relative to recent history for the same material and city — current price, recent range, percentile, and a descriptive recent trend. It does not tell you to buy now or that prices will rise.',
  },
  {
    id: 'faq-window',
    question: 'What historical window is used?',
    answer:
      'By default, the last 90 days of LIVE/VERIFIED observations. The UI always shows the window dates and data freshness (how old the latest observation is).',
  },
  {
    id: 'faq-forecast',
    question: 'Does this predict future prices?',
    answer:
      'No. Trend language describes how the latest price compares with an earlier observation inside the window. Future commodity forecasting is not included unless a separately validated model is approved later.',
  },
  {
    id: 'faq-impact',
    question: 'What is project impact?',
    answer:
      'If you enter an approximate project quantity and an illustrative ₹/unit change, we multiply them to show how material cost would move. That change is illustrative — not a market forecast.',
  },
];

export const PRICE_POSITION_RELATED = [
  { href: '/construction/prices', label: 'Prices hub' },
  { href: '/construction/fair-price-checker', label: 'Fair Price Checker' },
  { href: '/construction/community-prices', label: 'Community prices' },
  { href: '/construction/cost-calculator', label: 'Cost calculator' },
];

export const PRICE_POSITION_SEO =
  'See where a material’s current observed price sits vs the last 90 days: range, percentile and recent trend. No buy/sell advice and no future price predictions. Indicative only.';
