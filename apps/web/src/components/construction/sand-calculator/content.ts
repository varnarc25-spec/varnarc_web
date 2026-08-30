/** SEO / FAQs for Sand Calculator. */

export const SAND_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How is sand quantity calculated?',
    answer:
      'For concrete and mortar: sand_m³ = wet_volume × dry_factor × (sand_parts / total_parts) × (1 + wastage%). For filling or generic volume, sand equals the geometric volume with wastage. Dry factors are typically 1.54 (concrete) and 1.33 (mortar/plaster).',
  },
  {
    id: 'faq-density',
    question: 'Why can I edit sand density?',
    answer:
      'Bulk density varies with moisture, grading and whether you use river sand or M-sand. The default 1600 kg/m³ is indicative — change it so tonne estimates match your supplier assumption.',
  },
  {
    id: 'faq-units',
    question: 'What units are supported?',
    answer:
      'Volumes in m³, ft³ or litres; areas in m²/ft²/yd²; dimensions in mm–ft. Results always show sand in cubic metres and cubic feet.',
  },
  {
    id: 'faq-cost',
    question: 'How is sand cost estimated?',
    answer:
      'Enter either ₹ per m³ or ₹ per tonne. Cost uses your sand volume (after wastage) or tonnes from your density assumption.',
  },
  {
    id: 'faq-related',
    question: 'How do I get cement or aggregate too?',
    answer:
      'Use the related Cement and Aggregate calculator links. For the same concrete mix, those tools share the same dry-factor and mix-ratio conventions.',
  },
];

export const SAND_CALC_RELATED = [
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
  { href: '/construction/aggregate-calculator', label: 'Aggregate calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/brick-calculator', label: 'Brick calculator' },
  { href: '/construction/materials/sand', label: 'Sand prices' },
];

export const SAND_CALC_SEO = `Estimate sand for concrete, masonry mortar, plaster, filling and generic volumes. See m³, ft³, tonnes from an editable bulk density, wastage and optional cost. Related cement and aggregate tools use the same mix conventions — indicative only.`;

export const SAND_WORKED_EXAMPLE = `Example (concrete): 1 m³ M20 (1:1.5:3), 5% wastage, density 1600 kg/m³. Dry volume = 1.54 m³. Sand fraction = 1.5/5.5. Sand ≈ 0.42 m³ before wastage ≈ 0.441 m³ after → ≈ 15.6 ft³ ≈ 0.706 tonnes.`;
