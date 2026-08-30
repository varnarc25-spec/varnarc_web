/** SEO / FAQs for AAC Block Calculator. */

export const AAC_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How are AAC blocks calculated?',
    answer:
      'Net wall volume = (length × height − openings) × thickness. Blocks = ceil(net volume ÷ modular block volume × (1 + wastage%)). Modular size adds the thin-bed joint to each block dimension — same shared masonry engine as the brick calculator.',
  },
  {
    id: 'faq-adhesive',
    question: 'How is AAC adhesive estimated?',
    answer:
      'Joint volume ≈ net wall volume − (blocks × solid block volume). Adhesive mass uses an indicative bulk density (default 1500 kg/m³) and optional bag size. Confirm manufacturer coverage rates on site.',
  },
  {
    id: 'faq-joint',
    question: 'What joint thickness should I use?',
    answer:
      'AAC thin-bed adhesive joints are typically 2–3 mm (default 3 mm). Do not use thick cement mortar joints unless your system specifies them.',
  },
  {
    id: 'faq-reverse',
    question: 'What is reverse mode?',
    answer:
      'Enter how many AAC blocks you have and the wall thickness. Varnarc estimates net wall area and material volume you can cover after reserving wastage.',
  },
  {
    id: 'faq-vs-brick',
    question: 'Should I use AAC or red bricks?',
    answer:
      'Use the Compare AAC vs red bricks CTA to review material differences. Quantities here are indicative only and are not a structural recommendation.',
  },
];

export const AAC_CALC_RELATED = [
  { href: '/construction/brick-calculator', label: 'Brick calculator' },
  { href: '/construction/cement-calculator?useCase=masonry', label: 'Cement / mortar calculator' },
  { href: '/construction/compare/aac-vs-brick', label: 'Compare AAC vs red bricks' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/materials/aac-blocks', label: 'AAC material prices' },
];

export const AAC_CALC_SEO = `Estimate AAC (autoclaved aerated concrete) blocks for walls: openings, thin-bed joints, wastage, adhesive volume/kg, and cost. Reverse mode estimates wall coverage from a block count. Uses the shared Varnarc masonry calculation engine — indicative only.`;

export const AAC_WORKED_EXAMPLE = `Example: 10 m × 3 m wall, 200 mm thick, 4 m² openings, 600×200×200 mm AAC with 3 mm joints. Net area = 26 m² → volume = 5.2 m³. Modular block ≈ 0.603×0.203×0.203 m. Apply wastage, then estimate thin-bed adhesive from joint volume.`;
