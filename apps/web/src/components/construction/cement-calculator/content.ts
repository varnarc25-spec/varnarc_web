/** SEO / FAQs for Cement Calculator. */

export const CEMENT_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'What is the cement calculation formula?',
    answer:
      'For concrete: cement_kg = wet_volume_m³ × 1.54 × (cement_parts / total_parts) × 1440 × (1 + wastage%). For plaster, masonry mortar and screed the dry factor is typically 1.33 and aggregate parts are usually zero.',
  },
  {
    id: 'faq-bags',
    question: 'How do I convert cement kg to bags?',
    answer:
      'Bags = ceil(cement_kg ÷ bag_size_kg). Varnarc supports common 25 kg, 40 kg and 50 kg bag sizes. Always confirm the bag weight printed by your supplier.',
  },
  {
    id: 'faq-mix',
    question: 'Which concrete mix should I choose?',
    answer:
      'Presets such as M15 (1:2:4) and M20 (1:1.5:3) are common planning ratios. Use the mix specified by your structural engineer for actual construction — this tool is indicative only.',
  },
  {
    id: 'faq-wastage',
    question: 'Why add wastage?',
    answer:
      'Site spillage, uneven thickness and handling losses mean purchased cement often exceeds the theoretical quantity. A 5–10% allowance is common for planning.',
  },
  {
    id: 'faq-sand',
    question: 'Why show sand volume?',
    answer:
      'Where the mix includes sand, Varnarc shows the related dry sand share so you can plan mortar/concrete materials together. Verify moisture and bulking on site.',
  },
];

export const CEMENT_CALC_RELATED = [
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
  { href: '/construction/sand-calculator', label: 'Sand calculator' },
  { href: '/construction/brick-calculator', label: 'Brick calculator' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/materials/cement', label: 'Check cement prices' },
];

export const CEMENT_CALC_SEO = `Estimate cement for concrete, masonry mortar, plastering and floor screed — or reverse: how much work can N bags cover? See kilograms, bags, wastage, formula steps and limitations. Indicative planning figures only.`;

export const CEMENT_WORKED_EXAMPLE = `Example (concrete): 1 m³ of M20 (1:1.5:3) with 5% wastage. Dry volume = 1 × 1.54 = 1.54 m³. Cement fraction = 1/5.5. Cement ≈ 1.54 × (1/5.5) × 1440 ≈ 403 kg before wastage, ≈ 423 kg after 5% wastage → about 9 bags of 50 kg.`;
