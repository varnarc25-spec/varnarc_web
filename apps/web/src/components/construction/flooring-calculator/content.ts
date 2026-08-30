/** SEO / FAQs for Flooring Calculator — no product endorsements. */

export const FLOORING_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How is flooring quantity calculated?',
    answer:
      'Net floor area is the sum of each room’s length × width. Purchase area applies wastage. Material quantity converts purchase area into your unit (m², ft², sq yd or boxes). Cost = quantity × your rate.',
  },
  {
    id: 'faq-types',
    question: 'What do flooring types change?',
    answer:
      'The category only suggests a default wastage percentage (editable) and labels the result. It does not recommend brands or products.',
  },
  {
    id: 'faq-rooms',
    question: 'Can I enter multiple rooms?',
    answer:
      'Yes. Add room rows with their own dimensions. Areas are summed before wastage. For identical rooms you can also use a single size × room count.',
  },
  {
    id: 'faq-boxes',
    question: 'How do boxes work?',
    answer:
      'Choose material unit “box” and enter how much area one box covers. Boxes = ceil(purchase area ÷ coverage per box).',
  },
  {
    id: 'faq-compare',
    question: 'Where can I compare flooring options?',
    answer:
      'Use the Compare materials CTA for side-by-side attributes. This calculator stays quantity-focused and does not endorse products.',
  },
];

export const FLOORING_CALC_RELATED = [
  { href: '/construction/tile-calculator', label: 'Tile calculator' },
  { href: '/construction/compare', label: 'Compare materials' },
  { href: '/construction/paint-calculator', label: 'Paint calculator' },
  { href: '/construction/materials/flooring', label: 'Flooring materials' },
  { href: '/construction/renovation-cost-calculator', label: 'Renovation cost' },
];

export const FLOORING_CALC_SEO = `Estimate flooring purchase area and cost for tiles, marble, granite, wood/laminate, vinyl or custom types. Multi-room rows, wastage, material units and rates — no product endorsements. Compare materials separately. Indicative only.`;

export const FLOORING_WORKED_EXAMPLE = `Example: Living 5×4 m + Bedroom 3×3 m = 29 m² net. Tiles with 10% wastage → 31.9 m² to buy. At ₹800/m² ≈ ₹25,520 (indicative).`;
