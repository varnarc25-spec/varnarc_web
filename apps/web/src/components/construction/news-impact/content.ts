export const NEWS_IMPACT_FAQS = [
  {
    id: 'faq-layers',
    question: 'How is news different from impact?',
    answer:
      'Reported news is the Varnarc article and tagged materials. A scenario assumption is an illustrative ₹/unit change. Calculated potential impact is quantity × that change — only when your project has a matching quantity. News never guarantees the price will move.',
  },
  {
    id: 'faq-qty',
    question: 'Why is impact sometimes unavailable?',
    answer:
      'We do not invent material quantities. If your saved project or BOQ has no line for that material (or the unit does not match the scenario, e.g. kg vs bag), impact is not calculated.',
  },
  {
    id: 'faq-forecast',
    question: 'Is this a price forecast?',
    answer:
      'No. Scenario deltas are assumptions for arithmetic sensitivity only. They are not predictions and are not claimed to follow from the news event.',
  },
];

export const NEWS_IMPACT_RELATED = [
  { href: '/construction/price-position', label: 'Price position' },
  { href: '/construction/prices', label: 'Prices hub' },
  { href: '/construction/materials', label: 'Materials' },
  { href: '/articles', label: 'Articles' },
];

export const NEWS_IMPACT_SEO =
  'Explore how tagged construction news and illustrative unit-price scenarios relate to your project material quantities — arithmetic only, with news, assumptions and impact shown separately. No guaranteed price moves.';
