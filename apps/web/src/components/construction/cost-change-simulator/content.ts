/** Editorial copy for the cost-change simulator. */

export const COST_SIM_FAQS = [
  {
    id: 'faq-what',
    question: 'What does this construction cost simulator show?',
    answer:
      'It lets you move sliders for area, quality, floors, steel, cement, labour and contingency, then immediately see how the indicative project total, ₹ change, % difference and cost per sq ft respond — using the same Varnarc construction calculation engine as the cost calculator.',
  },
  {
    id: 'faq-commodity',
    question: 'Does Varnarc predict future steel or cement prices?',
    answer:
      'No. Rate sliders are educational sensitivity tools only. They do not forecast commodity markets or issue advice on when to buy materials.',
  },
  {
    id: 'faq-reset',
    question: 'What does Reset to market defaults do?',
    answer:
      'It restores built-up area, quality, floors, contingency, interior level and steel / cement / labour rates to the current indicative market assumptions used by the engine.',
  },
  {
    id: 'faq-engine',
    question: 'Is this a separate cost formula?',
    answer:
      'No. Every total is produced by the central calculateConstructionCost engine. Insights (for example +100 sq ft or +₹5/kg steel) are computed by re-running that same engine with one input changed.',
  },
];

export const COST_SIM_RELATED = [
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/scenario-compare', label: 'Scenario comparison' },
  { href: '/construction/affordability-calculator', label: 'Affordability calculator' },
  { href: '/construction/cost-optimization', label: 'Reduce my budget' },
];

export const COST_SIM_SEO = `Wondering what moves your house construction budget? This interactive simulator shows how built-up area, finish quality, floors, steel and cement rates, labour, contingency and interiors change an indicative project total — without claiming to predict future material prices.`;
