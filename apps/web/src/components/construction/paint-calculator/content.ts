/** SEO / FAQs for Paint Calculator. */

export const PAINT_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'How is paint quantity calculated?',
    answer:
      'Net area = wall area − doors − windows (+ ceiling if selected). Paint litres = net area × coats ÷ coverage (m²/L) × (1 + wastage%). Override coverage to match your manufacturer tin.',
  },
  {
    id: 'faq-coverage',
    question: 'Can I change manufacturer coverage?',
    answer:
      'Yes. Default is 10 m² per litre per coat (indicative). Enter the m²/L or ft²/L from your paint data sheet so litres match the brand you buy.',
  },
  {
    id: 'faq-reverse',
    question: 'What is reverse mode?',
    answer:
      'Enter how many litres you have and coat count — the calculator estimates how much wall/ceiling area those litres can cover after wastage.',
  },
  {
    id: 'faq-primer-putty',
    question: 'How are primer and putty estimated?',
    answer:
      'When selected, primer uses its own coverage and coats on the same net area. Putty uses kg per m² of net paintable surface (default 1.1 kg/m²) plus wastage.',
  },
  {
    id: 'faq-packages',
    question: 'How are tin sizes recommended?',
    answer:
      'Exact litres are rounded up into configured package sizes (default 1, 4, 10, 20 L) using larger tins first so you buy enough without under-ordering.',
  },
];

export const PAINT_CALC_RELATED = [
  { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
  { href: '/construction/tile-calculator', label: 'Tile calculator' },
  { href: '/construction/renovation-cost-calculator', label: 'Renovation cost' },
  { href: '/construction/materials/paint', label: 'Paint materials' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/compare/asian-paints-vs-berger', label: 'Asian Paints vs Berger' },
];

export const PAINT_CALC_SEO = `Estimate interior paint litres from room dimensions or wall area — doors, windows, ceiling, coats, overridable manufacturer coverage, primer, putty, package sizes and cost. Room-by-room, whole-house and reverse “area from litres” modes. Indicative only.`;

export const PAINT_WORKED_EXAMPLE = `Example: 4 × 3 × 3 m room, 1 door, 2 windows, 2 coats, 10 m²/L, 10% wastage. Walls ≈ 42 m² − openings ≈ 4.8 m² → ~37.2 m². Paint ≈ 37.2 × 2 / 10 × 1.10 ≈ 8.2 L → buy the next pack combination (e.g. 1×10 L or 2×4 L + …).`;
