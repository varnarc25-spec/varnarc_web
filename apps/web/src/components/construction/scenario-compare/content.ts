/** Editorial SEO for Construction Scenario Comparison (clean URL only). */

export const SCENARIO_COMPARE_FAQS = [
  {
    id: 'faq-what',
    question: 'What is construction scenario comparison?',
    answer:
      'It lets you compare up to three build configurations side by side — for example Standard vs Premium, Hyderabad vs Bengaluru, or 1500 vs 1800 sq ft — on total cost, ₹/sq ft, material, labour, contingency, duration and indicative material quantities.',
  },
  {
    id: 'faq-index',
    question: 'Are my custom comparisons indexed by search engines?',
    answer:
      'No. Shared comparison links use a compact query parameter and are marked noindex. Only this editorial page (without your scenario payload) is meant to be indexed.',
  },
  {
    id: 'faq-duplicate',
    question: 'How do I change only one attribute?',
    answer:
      'Duplicate an existing scenario, then edit just the fields you care about — quality, city, floors or area — so the rest stays constant for a fair comparison.',
  },
  {
    id: 'faq-accuracy',
    question: 'How accurate are the cost and quantity figures?',
    answer:
      'They use the same indicative Varnarc construction cost model and planning quantity factors. They are not contractor quotations. Always verify locally.',
  },
];

export const SCENARIO_COMPARE_RELATED = [
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/affordability-calculator', label: 'Affordability calculator' },
  { href: '/construction/renovation-cost-calculator', label: 'Renovation cost calculator' },
  { href: '/construction/compare', label: 'Compare materials' },
  { href: '/construction/projects', label: 'Saved projects' },
];

export const SCENARIO_COMPARE_SEO = `Compare construction scenarios before you lock a budget. Side-by-side views help you see how quality, city, floors and built-up area move total cost, contingency and rough material quantities — then share a private link or save your preferred option to a project.`;
