/** Editorial copy for Reduce my construction budget. */

export const COST_OPT_FAQS = [
  {
    id: 'faq-safe',
    question: 'Will this tool cut steel, concrete grade or foundation to save money?',
    answer:
      'No. Reinforcement, concrete strength and foundation design are never automatically downgraded. Those items are listed as exclusions and require a licensed structural engineer if changes are considered.',
  },
  {
    id: 'faq-classes',
    question: 'What is the difference between the three recommendation groups?',
    answer:
      'Safe planning adjustments (for example trimming built-up area) are typically lowest risk for budgeting. Finish/specification adjustments change aesthetics and brands. Items requiring professional review are advisory only and are not auto-applied.',
  },
  {
    id: 'faq-compare',
    question: 'Can I compare the optimized plan to my current estimate?',
    answer:
      'Yes. After selecting recommendations you can open Scenario comparison with current vs optimized configurations prefilled.',
  },
  {
    id: 'faq-quote',
    question: 'Is the revised total a contractor quote?',
    answer:
      'No. Figures are indicative educational estimates from the Varnarc construction calculation engine plus finish-allocation savings. Always verify with your architect and contractor.',
  },
];

export const COST_OPT_RELATED = [
  { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
  { href: '/construction/scenario-compare', label: 'Scenario comparison' },
  { href: '/construction/cost-change-simulator', label: 'Cost change simulator' },
  { href: '/construction/affordability-calculator', label: 'Affordability calculator' },
];

export const COST_OPT_SEO = `Need to bring a house construction budget down without unsafe shortcuts? This tool suggests planning and finish adjustments — never automatic cuts to reinforcement, concrete strength or foundation design — and can open a side-by-side scenario comparison of your current vs optimized plan.`;
