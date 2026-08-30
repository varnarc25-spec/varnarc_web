/** SEO / FAQs for Beam Volume Calculator. */

export const BEAM_CALC_FAQS = [
  {
    id: 'faq-volume',
    question: 'How is beam concrete volume calculated?',
    answer:
      'Individual volume = width × depth × length. Total wet volume multiplies by quantity. Order volume adds wastage for planning.',
  },
  {
    id: 'faq-materials',
    question: 'How are material quantities estimated?',
    answer:
      'When enabled, order volume × dry factor 1.54 is split by the selected concrete grade mix (shared with the RCC/concrete calculators).',
  },
  {
    id: 'faq-steel',
    question: 'Does this design beam reinforcement?',
    answer:
      'No. This tool does not generate structural reinforcement design. If you ever enable an indicative steel estimate, it is marked preliminary only and actual usage requires structural drawings from a qualified engineer.',
  },
  {
    id: 'faq-related',
    question: 'What about slabs, columns and footings?',
    answer:
      'Use the linked slab, column and footing calculators, or the RCC hub — they share the same concrete volume utilities.',
  },
];

export const BEAM_CALC_RELATED = [
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/slab-calculator', label: 'Slab calculator' },
  { href: '/construction/column-calculator', label: 'Column calculator' },
  { href: '/construction/footing-calculator', label: 'Footing calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
];

export const BEAM_CALC_SEO = `Calculate RCC beam concrete volume from width, depth, length and quantity. Optional mix materials and cost via shared concrete utilities. Does not generate structural reinforcement design.`;

export const BEAM_WORKED_EXAMPLE = `Example: B = 230 mm, D = 450 mm, L = 4 m, 3 beams, 5% wastage. Each = 0.414 m³; wet total = 1.242 m³; order ≈ 1.304 m³.`;
