/** SEO / FAQs for Varnarc BOQ Generator. */

export const BOQ_GEN_FAQS = [
  {
    id: 'faq-tender',
    question: 'Is this a professional tender BOQ?',
    answer:
      'No. Varnarc produces an indicative planning BOQ for quantity organization. It is not a substitute for a quantity surveyor, engineer schedule, or contractor tender document. Always verify quantities and rates locally.',
  },
  {
    id: 'faq-generate',
    question: 'How does generation from project assumptions work?',
    answer:
      'When you provide built-up area, floors, quality and build mode (or load a saved project), formulas produce provisional quantities for supported categories. Every auto-generated quantity shows its assumption so you can edit or replace it.',
  },
  {
    id: 'faq-tax',
    question: 'Why is tax sometimes hidden?',
    answer:
      'Tax is shown and applied only when you explicitly enable it and set a tax percent for your jurisdiction. Contingency can be set separately; defaults are planning allowances, not statutory tax advice.',
  },
  {
    id: 'faq-save',
    question: 'Can I save a BOQ to a construction project?',
    answer:
      'Yes. Sign in, open the generator with a project (or pick one), then Save. The BOQ appears on the project dashboard BOQ tab. You can also duplicate, print, export CSV, download PDF, or share a summary.',
  },
];

export const BOQ_GEN_RELATED = [
  { href: '/construction/contractor-quote-analyzer', label: 'Quote analyzer' },
  { href: '/construction/cost-calculator', label: 'Cost calculator' },
  { href: '/construction/project/new', label: 'Create project' },
  { href: '/construction/bar-bending-schedule', label: 'Bar bending schedule' },
  { href: '/construction/rcc-calculator', label: 'RCC calculator' },
  { href: '/construction/cement-calculator', label: 'Cement calculator' },
];

export const BOQ_GEN_SEO = `Build an indicative planning BOQ with editable items, units, quantities and rates. Generate from project assumptions where formulas are supported, review every auto quantity assumption, then save to a Varnarc construction project. Not a professional tender BOQ.`;

export const BOQ_GEN_WORKED_EXAMPLE = `Example: 1,200 sq ft new build, 2 floors, standard quality → provisional lines for preliminaries, excavation, PCC, RCC, steel, formwork, masonry, plaster, flooring, painting, MEP allowances and more. Edit any quantity or rate; contingency defaults to 5%; tax stays off until you enable it.`;
