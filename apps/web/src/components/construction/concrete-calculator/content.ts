/** SEO / FAQs for Concrete Calculator. */

export const CONCRETE_CALC_FAQS = [
  {
    id: 'faq-shapes',
    question: 'Which concrete shapes does Varnarc support?',
    answer:
      'Slab, rectangular footing, rectangular column, wall, circular column, and a custom rectangular volume. Inputs adapt to the selected shape.',
  },
  {
    id: 'faq-wet-vs-order',
    question: 'What is wet volume vs order volume?',
    answer:
      'Wet volume is the geometric concrete volume from your dimensions. Order volume adds wastage so you can plan ready-mix or site mixing with a buffer.',
  },
  {
    id: 'faq-materials',
    question: 'How are cement, sand and aggregate estimated?',
    answer:
      'Optional breakdown uses dry volume ≈ wet × 1.54 and your mix ratio (e.g. M20 = 1:1.5:3). Cement mass uses 1440 kg/m³. Water uses an indicative water–cement ratio by mass. Confirm with your mix design.',
  },
  {
    id: 'faq-cost',
    question: 'How is concrete cost calculated?',
    answer:
      'Enter a custom rate per cubic metre. Estimated cost = order volume (m³) × your rate. This is indicative only — not a supplier quote.',
  },
  {
    id: 'faq-units',
    question: 'Can I mix metric and imperial units?',
    answer:
      'Yes. Each dimension has its own unit (mm, cm, m, inch, ft). Varnarc converts everything to metres before applying the shape formula.',
  },
];

export const CONCRETE_CALC_RELATED = [
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/slab-calculator', label: 'Slab calculator' },
  { href: '/construction/beam-calculator', label: 'Beam calculator' },
  { href: '/construction/column-calculator', label: 'Column calculator' },
  { href: '/construction/footing-calculator', label: 'Footing calculator' },
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/steel-calculator', label: 'Steel calculator' },
];

export const CONCRETE_CALC_SEO = `Calculate wet and wastage-adjusted concrete volume for slabs, footings, columns, walls and circular columns. Optional cement, sand, aggregate and water breakdown from mix assumptions, unit conversion and custom ₹/m³ cost — indicative planning figures only.`;

export const CONCRETE_WORKED_EXAMPLE = `Example (slab): 5 m × 4 m × 150 mm. Wet volume = 5 × 4 × 0.15 = 3 m³. With 5% wastage, order volume ≈ 3.15 m³. For M20, dry volume ≈ 3.15 × 1.54; cement share 1/5.5 of dry volume × 1440 kg/m³.`;
