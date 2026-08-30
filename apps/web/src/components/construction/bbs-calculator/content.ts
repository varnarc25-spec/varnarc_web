/** SEO / FAQs for Bar Bending Schedule workspace. */

export const BBS_CALC_FAQS = [
  {
    id: 'faq-purpose',
    question: 'Is this a structural design tool?',
    answer:
      'No. This workspace organizes bar bending quantities from details you enter. It does not invent reinforcement from architectural dimensions or design members for load.',
  },
  {
    id: 'faq-inputs',
    question: 'What do I enter for each row?',
    answer:
      'Bar mark, member, diameter, shape/type, quantity, cutting length and optional notes. Cutting length must come from drawings or an engineer — the tool does not derive it from plan sizes.',
  },
  {
    id: 'faq-calc',
    question: 'How are length and weight calculated?',
    answer:
      'Total length = cutting length × quantity. Unit weight uses the shared steel formula w = d²/162 (kg/m). Total weight = unit weight × total length. Totals roll up by diameter, member and overall project.',
  },
  {
    id: 'faq-export',
    question: 'Can I print or export the schedule?',
    answer:
      'Yes. Export CSV using the shared construction export helpers, print the schedule, or save a project estimate snapshot when signed in.',
  },
];

export const BBS_CALC_RELATED = [
  { href: '/construction/steel-calculator', label: 'Steel weight calculator' },
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/beam-calculator', label: 'Beam calculator' },
  { href: '/construction/column-calculator', label: 'Column calculator' },
  { href: '/construction/slab-calculator', label: 'Slab calculator' },
];

export const BBS_CALC_SEO = `Organize a bar bending schedule from user-entered bar marks, members, diameters, shapes, quantities and cutting lengths. Calculate length and weight with totals by diameter, member and project. Not structural design — does not invent reinforcement from architectural dimensions.`;

export const BBS_WORKED_EXAMPLE = `Example: mark B1, Beam B1, Ø12 straight, qty 10, cutting length 4.2 m → 42 m and ~37.3 kg. Stirrups and other members roll into diameter and member totals.`;
