/** SEO / FAQs for Aggregate Calculator. */

export const AGGREGATE_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How is aggregate calculated for concrete?',
    answer:
      'agg_m³ = wet_concrete × 1.54 × (aggregate_parts / total_parts) × (1 + wastage%). For M20 (1:1.5:3) the aggregate share is 3/5.5 of dry volume.',
  },
  {
    id: 'faq-fill',
    question: 'What about fill or area × depth?',
    answer:
      'Generic fill uses length × width × depth (or a direct volume). Area × depth multiplies plan area by fill depth. No mix fraction is applied — only wastage.',
  },
  {
    id: 'faq-density',
    question: 'Why edit aggregate density?',
    answer:
      'Bulk density varies with stone size, moisture and voids. The default 1500 kg/m³ is indicative for crushed aggregate — change it so kg/tonne estimates match your supplier assumption.',
  },
  {
    id: 'faq-related',
    question: 'How do I get cement and sand too?',
    answer:
      'Use the related Concrete and Cement calculators with the same mix. They share dry-factor and ratio conventions with this tool.',
  },
];

export const AGGREGATE_CALC_RELATED = [
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/sand-calculator', label: 'Sand calculator' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/materials/aggregate', label: 'Aggregate prices' },
];

export const AGGREGATE_CALC_SEO = `Estimate crushed stone / jelly aggregate for concrete mixes, generic fill and area × depth. See m³, ft³, kg, tonnes from an editable density, wastage and optional cost. Related concrete and cement tools — indicative only.`;

export const AGGREGATE_WORKED_EXAMPLE = `Example (concrete): 1 m³ M20, 5% wastage, density 1500 kg/m³. Dry volume = 1.54 m³. Aggregate fraction = 3/5.5. Aggregate ≈ 0.84 m³ before wastage ≈ 0.882 m³ after → ≈ 31.1 ft³ ≈ 1323 kg ≈ 1.32 tonnes.`;
