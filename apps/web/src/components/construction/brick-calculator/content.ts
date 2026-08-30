/** SEO / FAQs for Brick Calculator. */

export const BRICK_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'What is the brick calculation formula?',
    answer:
      'Net wall volume = (wall length × height − openings) × thickness. Bricks = ceil(net volume ÷ modular brick volume × (1 + wastage%)). Modular size adds the mortar joint to each brick dimension.',
  },
  {
    id: 'faq-sizes',
    question: 'What brick sizes does Varnarc support?',
    answer:
      'Indian modular 190×90×90 mm, Indian traditional 230×110×75 mm, English standard 215×102.5×65 mm, common AAC block sizes, and fully custom L×W×H.',
  },
  {
    id: 'faq-reverse',
    question: 'What is reverse mode?',
    answer:
      'Enter how many bricks you have and the wall thickness. Varnarc estimates the net wall area and volume you can build after reserving wastage.',
  },
  {
    id: 'faq-mortar',
    question: 'How is mortar estimated?',
    answer:
      'Mortar volume ≈ net wall volume − (bricks × solid brick volume). Dry mortar uses factor 1.33 with a configurable cement:sand mix (default 1:6) for indicative cement and sand.',
  },
  {
    id: 'faq-openings',
    question: 'How do openings work?',
    answer:
      'Enter a total opening area, or a count with width and height. Opening area is deducted from the gross wall face before volume and brick counts are computed.',
  },
];

export const BRICK_CALC_RELATED = [
  { href: '/construction/aac-block-calculator', label: 'AAC block calculator' },
  { href: '/construction/cement-calculator?useCase=masonry', label: 'Cement / mortar calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/sand-calculator', label: 'Sand calculator' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/materials/brick', label: 'Brick prices' },
];

export const BRICK_CALC_SEO = `Estimate bricks or blocks for masonry walls: gross area, opening deductions, net volume, brick count with wastage, optional mortar (cement and sand), and cost. Includes reverse mode — how much wall area can X bricks build? Indicative only.`;

export const BRICK_WORKED_EXAMPLE = `Example: 10 m × 3 m wall, 200 mm thick, 4 m² openings, modular 190×90×90 mm bricks with 10 mm joints (modular 200×100×100 mm = 0.002 m³). Net area = 26 m² → volume = 5.2 m³ → ≈ 2,600 bricks before wastage; with 5% wastage ≈ 2,730 bricks.`;

export const BRICK_COMMON_SIZES = [
  { label: 'Indian modular', size: '190 × 90 × 90 mm' },
  { label: 'Indian traditional', size: '230 × 110 × 75 mm' },
  { label: 'English standard', size: '215 × 102.5 × 65 mm' },
  { label: 'AAC 100 mm', size: '600 × 200 × 100 mm' },
  { label: 'AAC 150 mm', size: '600 × 200 × 150 mm' },
  { label: 'AAC 200 mm', size: '600 × 200 × 200 mm' },
];
