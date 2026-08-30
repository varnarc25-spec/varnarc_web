/** SEO / FAQs for Slab Calculator. */

export const SLAB_CALC_FAQS = [
  {
    id: 'faq-area',
    question: 'How is slab area calculated?',
    answer:
      'Slab area = length × width for one slab. Total area multiplies by the number of slabs. Concrete volume = area × thickness × quantity, then wastage.',
  },
  {
    id: 'faq-materials',
    question: 'How are cement, sand and aggregate estimated?',
    answer:
      'Optional: order volume × dry factor 1.54, split by the selected grade mix (e.g. M20 ≈ 1:1.5:3). Assumptions are listed on the result.',
  },
  {
    id: 'faq-steel',
    question: 'Is the steel estimate a structural design?',
    answer:
      'No. If enabled, steel is labelled preliminary only — a thumb-rule kg/m³ range for planning. It is separate from structural engineering design. Actual reinforcement must follow drawings by a qualified engineer.',
  },
  {
    id: 'faq-rcc',
    question: 'How does this relate to the RCC calculator?',
    answer:
      'This page focuses on slabs. The RCC calculator covers beams, columns and footings with the same transparent mix and steel disclaimers.',
  },
];

export const SLAB_CALC_RELATED = [
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/beam-calculator', label: 'Beam calculator' },
  { href: '/construction/column-calculator', label: 'Column calculator' },
  { href: '/construction/footing-calculator', label: 'Footing calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/steel-calculator', label: 'Steel weight calculator' },
];

export const SLAB_CALC_SEO = `Calculate slab area and RCC concrete volume from length, width, thickness and number of slabs. Optional mix materials and cost. Preliminary steel (if shown) is clearly labelled and is not structural design.`;

export const SLAB_WORKED_EXAMPLE = `Example: 5 × 4 m slab, 150 mm thick, 1 slab, M20, 5% wastage. Area = 20 m². Wet volume = 3.0 m³; order ≈ 3.15 m³. Mix breakdown optional. Steel estimate remains preliminary only if enabled.`;
