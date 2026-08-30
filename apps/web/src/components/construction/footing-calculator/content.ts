/** SEO / FAQs for Footing Concrete Calculator. */

export const FOOTING_CALC_FAQS = [
  {
    id: 'faq-shapes',
    question: 'Which footing shapes are supported?',
    answer:
      'Rectangular (L × W × D) and square (L × L × D). Enter plan size, depth, quantity and wastage. An optional lean PCC bed can be included under the footing.',
  },
  {
    id: 'faq-pcc',
    question: 'How is the PCC layer calculated?',
    answer:
      'When enabled, PCC volume uses the same plan area as the footing times the PCC thickness, then applies the same wastage percent. Lean mix defaults to M7.5 (1:4:8) unless you choose M5 or M10.',
  },
  {
    id: 'faq-sizing',
    question: 'Does this size the footing from building loads?',
    answer:
      'No. This tool does not attempt structural footing sizing based on building load. Enter dimensions from drawings or an engineer. Outputs are volume, optional PCC, materials and cost for planning only.',
  },
  {
    id: 'faq-related',
    question: 'What about columns, beams and slabs?',
    answer:
      'Use the linked column, beam and slab calculators, or the RCC hub — they share the same concrete volume utilities.',
  },
];

export const FOOTING_CALC_RELATED = [
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/column-calculator', label: 'Column calculator' },
  { href: '/construction/beam-calculator', label: 'Beam calculator' },
  { href: '/construction/slab-calculator', label: 'Slab calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
];

export const FOOTING_CALC_SEO = `Calculate RCC footing concrete for rectangular and square footings. Optional lean PCC bed, mix materials and cost via shared utilities. Does not size footings from building loads.`;

export const FOOTING_WORKED_EXAMPLE = `Example: 2.0 × 1.5 m × 0.4 m deep, 2 footings, 5% wastage, 75 mm PCC. RCC each = 1.2 m³; PCC each = 0.225 m³. Order volumes include wastage.`;
