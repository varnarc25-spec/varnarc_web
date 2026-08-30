/** SEO / FAQs for Construction Project Readiness Checker. */

export const PROJECT_READINESS_FAQS = [
  {
    id: 'faq-what',
    question: 'What does the Project Readiness Checker measure?',
    answer:
      'It scores planning readiness from checklist items you mark — budget, drawings, BOQ, quotes, timeline and similar. It does not judge engineering quality or structural safety.',
  },
  {
    id: 'faq-safe',
    question: 'Does a high score mean my project is structurally safe?',
    answer:
      'No. Varnarc never claims a project is structurally safe from this checklist. Structural adequacy requires qualified professionals and proper design review.',
  },
  {
    id: 'faq-score',
    question: 'How is the readiness score calculated?',
    answer:
      'Each item has a weight (critical = 3, high = 2, medium = 1). Done earns full weight, In progress earns half, Not started earns zero. Not applicable items are excluded. Score = round(100 × earned ÷ applicable weight).',
  },
  {
    id: 'faq-next',
    question: 'What are the recommended next steps?',
    answer:
      'Missing or incomplete items map to Varnarc tools where they exist — for example Create BOQ, Estimate construction cost, or Create timeline — plus directory links for professionals when appropriate.',
  },
];

export const PROJECT_READINESS_RELATED = [
  { href: '/construction/cost-calculator', label: 'Cost calculator' },
  { href: '/construction/boq-generator', label: 'BOQ generator' },
  { href: '/construction/timeline-planner', label: 'Timeline planner' },
  { href: '/construction/contractor-quote-analyzer', label: 'Quote analyzer' },
  { href: '/construction/professionals', label: 'Professionals directory' },
  { href: '/construction/checklists', label: 'Checklists' },
];
