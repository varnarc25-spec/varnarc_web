/** SEO / FAQs for Contractor Quote Analyzer. */

export const QUOTE_ANALYZER_FAQS = [
  {
    id: 'faq-pdf',
    question: 'Can I upload a PDF quote?',
    answer:
      'Not in this version. Use manual entry or a structured CSV spreadsheet. PDF/OCR extraction is not offered until reliable parsing infrastructure exists.',
  },
  {
    id: 'faq-missing',
    question: 'What does “Item missing from Quote B” mean?',
    answer:
      'The item appears in another quote but not in Quote B. Varnarc does not assume it is included elsewhere — map it manually if the descriptions differ, or treat it as a scope gap.',
  },
  {
    id: 'faq-benchmark',
    question: 'Does this show market or fair prices?',
    answer:
      'No. This version only compares the quotes you provide. It does not invent market benchmark data. Market/reference integration may come later.',
  },
  {
    id: 'faq-judgement',
    question: 'Does Varnarc say which contractor is better?',
    answer:
      'No. The analyzer never labels a contractor good or bad. It highlights totals, category gaps, missing items and large differences so you can decide.',
  },
];

export const QUOTE_ANALYZER_RELATED = [
  { href: '/construction/boq-generator', label: 'BOQ generator' },
  { href: '/construction/fair-price-checker', label: 'Fair Price Checker' },
  { href: '/construction/scenario-compare', label: 'Scenario compare' },
  { href: '/construction/prices', label: 'Construction prices' },
];
