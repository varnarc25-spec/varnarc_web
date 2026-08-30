/** SEO / FAQs for Column Concrete Calculator. */

export const COLUMN_CALC_FAQS = [
  {
    id: 'faq-shapes',
    question: 'Which column shapes are supported?',
    answer:
      'Rectangular (B × D × H) and circular (π × (Ø/2)² × H). Pick a shape, enter dimensions, height, number of columns and wastage.',
  },
  {
    id: 'faq-volume',
    question: 'What volumes does the calculator return?',
    answer:
      'Individual column volume, total wet concrete for the quantity, and order volume after wastage. Optional mix materials and cost use the shared concrete utilities.',
  },
  {
    id: 'faq-design',
    question: 'Does this check load capacity or design reinforcement?',
    answer:
      'No. This tool does not provide structural design or load-capacity calculations. Use it for concrete volume and material planning only. Actual reinforcement must follow structural drawings from a qualified engineer.',
  },
  {
    id: 'faq-related',
    question: 'What about beams, slabs and footings?',
    answer:
      'Use the linked beam, slab and footing calculators, or the RCC hub — they share the same concrete volume utilities.',
  },
];

export const COLUMN_CALC_RELATED = [
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/beam-calculator', label: 'Beam calculator' },
  { href: '/construction/slab-calculator', label: 'Slab calculator' },
  { href: '/construction/footing-calculator', label: 'Footing calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
];

export const COLUMN_CALC_SEO = `Calculate RCC column concrete volume for rectangular and circular columns. Enter dimensions, height, quantity and wastage for individual and total volume, optional mix materials and cost. Does not provide structural design or load-capacity calculations.`;

export const COLUMN_WORKED_EXAMPLE = `Rectangular example: 230 × 450 mm × 3 m, 6 columns, 5% wastage → each ≈ 0.311 m³; wet total ≈ 1.863 m³. Circular example: Ø 300 mm × 3 m → each ≈ 0.212 m³.`;
