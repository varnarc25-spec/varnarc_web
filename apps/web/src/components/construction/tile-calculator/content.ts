/** SEO / FAQs for Tile Calculator. */

export const TILE_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How are tiles calculated?',
    answer:
      'Tiles along each side = ceil(room dimension ÷ (tile size + grout)). Base quantity = columns × rows × number of rooms. Wastage is then added as whole tiles for purchase.',
  },
  {
    id: 'faq-grout',
    question: 'What does grout width do?',
    answer:
      'Optional grout increases the layout pitch so fewer full tiles fit in the same length/width. Leave it blank to count tiles butted edge-to-edge.',
  },
  {
    id: 'faq-wall',
    question: 'How does wall tile mode work?',
    answer:
      'Enter wall length and wall height instead of floor length and width. The same grid formula applies to the wall face area.',
  },
  {
    id: 'faq-reverse',
    question: 'What is reverse mode?',
    answer:
      'Enter how many tiles you have — the calculator estimates how much floor or wall area they can cover after allowing for wastage.',
  },
  {
    id: 'faq-boxes',
    question: 'How are boxes calculated?',
    answer:
      'When you enter tiles per box, boxes = ceil(total tiles to purchase ÷ tiles per box). Cost can use box price or per-tile price.',
  },
];

export const TILE_CALC_RELATED = [
  { href: '/construction/flooring-calculator', label: 'Flooring calculator' },
  { href: '/construction/compare', label: 'Compare materials' },
  { href: '/construction/paint-calculator', label: 'Paint calculator' },
  { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
  { href: '/construction/materials/tiles', label: 'Tile materials' },
];

export const TILE_CALC_SEO = `Estimate floor or wall tiles from room size and tile size — with optional grout, wastage, boxes, cost, visual grid and reverse “area from tiles” mode. Related flooring calculator. Indicative only.`;

export const TILE_WORKED_EXAMPLE = `Example: 3 × 3 m room, 300 × 300 mm tiles, 10% wastage. Grid = 10 × 10 = 100 tiles. Wastage +10 → buy 110 tiles. At 10 tiles/box → 11 boxes.`;
