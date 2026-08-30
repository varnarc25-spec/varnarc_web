/** Static SEO / education copy for the Construction Cost Calculator. */

export const COST_CALC_FAQS = [
  {
    id: 'faq-not-quote',
    question: 'Is this construction cost a guaranteed quote?',
    answer:
      'No. Varnarc estimates are indicative planning figures only. They are not quotations, tenders, or guarantees. Always verify rates with local contractors and suppliers.',
  },
  {
    id: 'faq-how-calculated',
    question: 'How does Varnarc calculate construction cost?',
    answer:
      'We start from an indicative base rate per sq ft, then apply location, quality, floor, foundation, structure and interior multipliers. Optional features (basement, parking, lift, etc.) are added, costs are split into material / labour / miscellaneous, and a contingency percentage is applied. A likely range is shown around the mid estimate.',
  },
  {
    id: 'faq-factors',
    question: 'What affects house construction cost the most?',
    answer:
      'Location labour and material markets, construction quality (basic to luxury), number of floors, structure and foundation type, basement or lift, interior finish level, and contingency for design changes all move the estimate.',
  },
  {
    id: 'faq-overrides',
    question: 'Can I override rates?',
    answer:
      'Yes. Use custom cost per sq ft or advanced rate overrides for base rate and material / labour / misc percentages so the calculator matches your local quotes.',
  },
  {
    id: 'faq-contingency',
    question: 'What is contingency in a construction estimate?',
    answer:
      'Contingency is a buffer (typically 5–15%) for unforeseen work, rate changes and minor design adjustments. It is not profit — it reduces the chance of mid-project budget shock.',
  },
];

export const COST_CALC_RELATED_CALCULATORS = [
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
  { href: '/construction/steel-calculator', label: 'Steel calculator' },
  { href: '/construction/brick-calculator', label: 'Brick calculator' },
  { href: '/construction/paint-calculator', label: 'Paint calculator' },
  { href: '/construction/renovation-cost-calculator', label: 'Renovation cost calculator' },
  { href: '/construction/affordability-calculator', label: 'Affordability calculator' },
  { href: '/construction/scenario-compare', label: 'Scenario comparison' },
  { href: '/construction/cost-change-simulator', label: 'Cost change simulator' },
  { href: '/construction/cost-optimization', label: 'Reduce my budget' },
  { href: '/construction/estimate', label: 'Quick cost estimator' },
  { href: '/construction/planner', label: 'Project planner' },
];

export const COST_CALC_CITY_PAGES = [
  {
    href: '/construction/construction-cost/hyderabad',
    label: 'Construction cost in Hyderabad',
    city: 'Hyderabad',
    description: 'Indicative house build cost, ₹/sq ft and local materials for Hyderabad.',
  },
  {
    href: '/construction/construction-cost/bengaluru',
    label: 'Construction cost in Bengaluru',
    city: 'Bengaluru',
    description: 'Indicative house build cost, ₹/sq ft and local materials for Bengaluru.',
  },
  {
    href: '/construction/construction-cost/chennai',
    label: 'Construction cost in Chennai',
    city: 'Chennai',
    description: 'Indicative house build cost, ₹/sq ft and local materials for Chennai.',
  },
  {
    href: '/construction/construction-cost/mumbai',
    label: 'Construction cost in Mumbai',
    city: 'Mumbai',
    description: 'Indicative house build cost, ₹/sq ft and local materials for Mumbai.',
  },
  {
    href: '/construction/construction-cost/pune',
    label: 'Construction cost in Pune',
    city: 'Pune',
    description: 'Indicative house build cost, ₹/sq ft and local materials for Pune.',
  },
  {
    href: '/construction/construction-cost/delhi',
    label: 'Construction cost in Delhi NCR',
    city: 'Delhi',
    description: 'Indicative house build cost, ₹/sq ft and local materials for Delhi NCR.',
  },
];

export const COST_CALC_EXAMPLE = {
  title: 'Example calculation',
  body: `Example: 1,500 sq ft independent house in Hyderabad, 2 floors, standard quality, 10% contingency. Varnarc applies the national base rate, location multiplier (~1.0 for Hyderabad), quality ×1.0, and floor multiplier (~1.04), then splits material / labour / misc and adds contingency. The result shows a mid estimate, a likely range (±12%), and category / phase breakdowns — always verify locally before budgeting.`,
};

export const LOCATION_SUGGESTIONS = [
  'Hyderabad',
  'Bengaluru',
  'Chennai',
  'Mumbai',
  'Pune',
  'Delhi',
  'Ahmedabad',
  'Kolkata',
  'Jaipur',
  'Coimbatore',
];
