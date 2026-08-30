/** SEO / FAQs for Steel Weight Calculator. */

export const STEEL_CALC_FAQS = [
  {
    id: 'faq-formula',
    question: 'What is the steel / rebar weight formula?',
    answer:
      'Unit weight w in kg per metre = d² / 162, where d is the bar diameter in millimetres. Total weight = w × length (m) × quantity. This is the standard engineering approximation used on site for TMT / mild steel rebar.',
  },
  {
    id: 'faq-why-162',
    question: 'Why divide by 162?',
    answer:
      'It approximates π/4 × steel density (7850 kg/m³) with diameter in mm. The density-based value is about d²/162.28; d²/162 is the conventional field formula.',
  },
  {
    id: 'faq-diameters',
    question: 'Which rebar diameters are supported?',
    answer:
      'Common construction sizes 6, 8, 10, 12, 16, 20, 25, 28, 32, 36 and 40 mm, plus any custom diameter you enter.',
  },
  {
    id: 'faq-multi',
    question: 'Can I calculate several diameters together?',
    answer:
      'Yes. Add editable table rows for each diameter, length and quantity. The footer totals kg, tonnes and optional cost.',
  },
  {
    id: 'faq-wastage',
    question: 'Does this include wastage or laps?',
    answer:
      'Not automatically. Add extra length or a separate row for wastage, laps, chairs or binding wire if you need them in the estimate.',
  },
];

export const STEEL_CALC_RELATED = [
  { href: '/construction/bar-bending-schedule', label: 'Bar bending schedule' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/cost-change-simulator', label: 'Steel rate cost simulator' },
  { href: '/construction/materials/steel', label: 'Steel / TMT prices' },
];

export const STEEL_CALC_SEO = `Calculate TMT / rebar steel weight with the standard formula w = d²/162. Enter multiple diameters, lengths and quantities in one table — see kg/m, total kg, tonnes and optional ₹/kg cost. Indicative planning figures only.`;

export const STEEL_WORKED_EXAMPLE = `Example: 20 bars of 12 mm, each 12 m long. Unit weight = 12²/162 = 0.889 kg/m. Total = 0.889 × 12 × 20 ≈ 213.3 kg. Add a second row for 16 mm bars and the table totals both.`;
