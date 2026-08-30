/** SEO / FAQs for RCC Calculator. */

export const RCC_CALC_FAQS = [
  {
    id: 'faq-purpose',
    question: 'What is this RCC calculator for?',
    answer:
      'Preliminary planning of concrete volume for slabs, beams, columns and footings, with optional cement/sand/aggregate from transparent mix assumptions. It is not a structural design tool.',
  },
  {
    id: 'faq-steel',
    question: 'Are steel quantities accurate?',
    answer:
      'No. When enabled, steel is only an indicative range from clearly labelled preliminary kg/m³ thumb rules. Actual reinforcement must follow structural drawings by a qualified engineer.',
  },
  {
    id: 'faq-mix',
    question: 'How are cement, sand and aggregate estimated?',
    answer:
      'Order volume (after wastage) × dry factor 1.54, then split by the selected grade mix (e.g. M20 ≈ 1:1.5:3). Assumptions are listed on the result.',
  },
  {
    id: 'faq-elements',
    question: 'Can I open slab, beam, column or footing tools separately?',
    answer:
      'Yes. Use the linked slab, beam, column and footing calculators — each opens this RCC tool focused on that element. The general concrete calculator also covers geometric volumes.',
  },
];

export const RCC_CALC_RELATED = [
  { href: '/construction/slab-calculator', label: 'Slab calculator' },
  { href: '/construction/beam-calculator', label: 'Beam calculator' },
  { href: '/construction/column-calculator', label: 'Column calculator' },
  { href: '/construction/footing-calculator', label: 'Footing calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete volume calculator' },
  { href: '/construction/steel-calculator', label: 'Steel weight calculator' },
];

export const RCC_CALC_SEO = `Estimate RCC concrete volume for slabs, beams, columns and footings with optional mix materials. Indicative steel uses labelled preliminary ratios only — not a substitute for structural design. Indicative planning figures.`;

export const RCC_WORKED_EXAMPLE = `Example: 5 × 4 m slab, 150 mm thick, M20, 5% wastage. Wet = 3.0 m³; order ≈ 3.15 m³. Mix breakdown uses dry factor 1.54. If steel estimate is enabled, a preliminary kg/m³ range is shown with an engineer-drawing disclaimer.`;
