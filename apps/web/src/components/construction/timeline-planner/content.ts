/** SEO / FAQs for Construction Timeline Planner. */

export const TIMELINE_PLANNER_FAQS = [
  {
    id: 'faq-precision',
    question: 'How precise are the generated durations?',
    answer:
      'They are coarse whole-week planning estimates only — not a day-level contractor programme or CPM schedule. Every generated duration is labelled as an estimate and is fully editable.',
  },
  {
    id: 'faq-inputs',
    question: 'What do I need to generate a timeline?',
    answer:
      'Set a project start date, built-up size, number of floors and construction type. Varnarc seeds default phases (Planning through Handover). Interior/renovation types skip irrelevant civil phases.',
  },
  {
    id: 'faq-status',
    question: 'What do the phase statuses mean?',
    answer:
      'Not started, In progress, Delayed and Completed. Delayed phases are also flagged when a phase is past its planned end while incomplete. Overall progress averages phase progress percentages.',
  },
  {
    id: 'faq-save',
    question: 'Can I save the timeline to a project?',
    answer:
      'Yes. Sign in, choose a saved project (or open with ?projectId=), then Save. Phases appear on the project dashboard Timeline tab.',
  },
];

export const TIMELINE_PLANNER_RELATED = [
  { href: '/construction/project/new', label: 'Create project' },
  { href: '/construction/boq-generator', label: 'BOQ Generator' },
  { href: '/construction/checklists', label: 'Phase checklists' },
  { href: '/construction/cost-calculator', label: 'Cost calculator' },
];

export const TIMELINE_PLANNER_SEO = `Plan a construction timeline with editable phases, estimated whole-week durations, status and progress. Generate defaults from start date, size, floors and construction type — then adjust. Not a contractor programme.`;

export const TIMELINE_PLANNER_WORKED_EXAMPLE = `Example: start 1 Sep 2026, 1,500 sq ft, 2 floors, house construction → estimated phases from Planning through Handover with sequential dependencies. Structure and finishes scale coarsely with floors; edit any duration or date before relying on the schedule.`;
