/** SEO / FAQs for Plaster Calculator. */

export const PLASTER_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How is plaster mortar calculated?',
    answer:
      'Net area = gross plaster area − openings. Wet volume = net area × thickness. Dry volume = wet × 1.33. Cement and sand split by the cement:sand mix (e.g. 1:4), with cement mass at 1440 kg/m³, then wastage.',
  },
  {
    id: 'faq-presets',
    question: 'What do interior and exterior presets do?',
    answer:
      'They only suggest a common thickness and mix (e.g. interior wall 12 mm @ 1:4). Assumptions are listed on the result. Thickness and mix stay fully editable — presets never lock values.',
  },
  {
    id: 'faq-openings',
    question: 'How are doors and windows handled?',
    answer:
      'Enter total opening area, or count × width × height. Opening area is deducted from the gross wall/ceiling area before thickness is applied.',
  },
  {
    id: 'faq-related',
    question: 'How does this relate to the cement and sand tools?',
    answer:
      'This calculator focuses on plaster coats with openings and surface presets. The cement and sand calculators share the same dry-factor and mix conventions for cross-checks.',
  },
];

export const PLASTER_CALC_RELATED = [
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/sand-calculator', label: 'Sand calculator' },
  { href: '/construction/brick-calculator', label: 'Brick calculator' },
  { href: '/construction/paint-calculator', label: 'Paint calculator' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/materials/cement', label: 'Cement prices' },
];

export const PLASTER_CALC_SEO = `Estimate plaster mortar for walls and ceilings: wet volume, dry-volume adjustment, cement bags, sand and optional cost. Interior/exterior presets suggest transparent defaults you can edit. Indicative only.`;

export const PLASTER_WORKED_EXAMPLE = `Example: 100 m² interior wall, 12 mm thick, 4 m² openings, mix 1:4, 10% wastage. Net area = 96 m². Wet = 1.152 m³. Dry = 1.152 × 1.33. Cement ≈ 1/5 of dry × 1440 × 1.10; sand ≈ 4/5 of dry × 1.10.`;
