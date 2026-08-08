export type HubTrustItem = {
  icon: string;
  title: string;
  description: string;
};

export type HubHeroStep = {
  icon: string;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
};

export type ModuleHubMeta = {
  badge: string;
  trustTitle: string;
  trustItems: HubTrustItem[];
  disclaimer: string;
  heroSteps: HubHeroStep[];
  searchPlaceholder: string;
};

const DEFAULT_TRUST: HubTrustItem[] = [
  {
    icon: 'scale',
    title: 'Unbiased comparisons',
    description: 'Independent research — no paid rankings.',
  },
  {
    icon: 'shield',
    title: 'Trusted information',
    description: 'Clear sources and regularly updated data.',
  },
  {
    icon: 'calculator',
    title: 'Free calculators',
    description: 'Plan with accurate, easy-to-use tools.',
  },
  {
    icon: 'book',
    title: 'Expert guides',
    description: 'Step-by-step help for real decisions.',
  },
  {
    icon: 'zap',
    title: 'Fast & simple',
    description: 'Find answers without clutter or confusion.',
  },
];

const DEFAULT_STEPS: HubHeroStep[] = [
  {
    icon: 'calculator',
    title: 'Calculate',
    description: 'Run numbers with free tools',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: 'scale',
    title: 'Compare',
    description: 'Side-by-side product views',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: 'check',
    title: 'Choose',
    description: 'Pick what fits your goals',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    icon: 'piggy',
    title: 'Save',
    description: 'Make smarter money choices',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

export const MODULE_HUB_META: Record<string, ModuleHubMeta> = {
  finance: {
    badge: 'FINANCE, SIMPLIFIED',
    trustTitle: 'Why use Varnarc Finance?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Varnarc provides general information and tools for education only. Rates, fees, and eligibility vary by provider. Verify details with banks and insurers before applying.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search loans, cards, insurance, calculators…',
  },
  construction: {
    badge: 'HOME & CONSTRUCTION',
    trustTitle: 'Why use Varnarc Construction?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Cost estimates and material prices are indicative. Confirm quantities and prices with local suppliers before purchasing.',
    heroSteps: [
      {
        icon: 'calculator',
        title: 'Estimate',
        description: 'Project cost calculators',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
      {
        icon: 'building',
        title: 'Compare',
        description: 'Materials and brands',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        icon: 'check',
        title: 'Plan',
        description: 'Checklists and timelines',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        icon: 'home',
        title: 'Build',
        description: 'Guides for every phase',
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
    ],
    searchPlaceholder: 'Search materials, brands, calculators…',
  },
  automobile: {
    badge: 'AUTOMOBILE HUB',
    trustTitle: 'Why use Varnarc Automobile?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Specs, prices, and offers change frequently. Confirm with dealers and manufacturers before buying.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search vehicles, brands, calculators…',
  },
  solar: {
    badge: 'SOLAR & ENERGY',
    trustTitle: 'Why use Varnarc Solar?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Solar savings depend on location, tariff, and system size. Consult certified installers for site assessments.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search solar calculators, guides, reviews…',
  },
  calculators: {
    badge: 'CALCULATORS',
    trustTitle: 'Why use Varnarc Calculators?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Calculator results are estimates for planning. Consult professionals for binding financial or engineering advice.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search calculators by name or topic…',
  },
  'ai-tools': {
    badge: 'AI TOOLS DIRECTORY',
    trustTitle: 'Why use Varnarc AI Tools?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'AI tool features and pricing change often. Review vendor terms and data policies before use.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search AI tools, categories…',
  },
  compare: {
    badge: 'COMPARE',
    trustTitle: 'Why use Varnarc Compare?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Comparison data is compiled for education. Verify specifications and prices with official sources.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search comparisons…',
  },
  reviews: {
    badge: 'REVIEWS',
    trustTitle: 'Why use Varnarc Reviews?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Reviews reflect editorial analysis at time of publication. Your experience may differ.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search reviews…',
  },
  articles: {
    badge: 'BLOG & GUIDES',
    trustTitle: 'Why read Varnarc?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Articles are for general information. Not financial, legal, or professional advice.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search articles and guides…',
  },
  tags: {
    badge: 'BROWSE BY TOPIC',
    trustTitle: 'Why browse by tag?',
    trustItems: DEFAULT_TRUST,
    disclaimer: 'Tagged content spans multiple topics. Verify details on individual pages.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search topics and tags…',
  },
  directory: {
    badge: 'BUSINESS DIRECTORY',
    trustTitle: 'Why use Varnarc Directory?',
    trustItems: DEFAULT_TRUST,
    disclaimer:
      'Directory listings are informational. Verify credentials and reviews before hiring.',
    heroSteps: DEFAULT_STEPS,
    searchPlaceholder: 'Search businesses, cities, categories…',
  },
};

export function getModuleHubMeta(key: string): ModuleHubMeta {
  return MODULE_HUB_META[key] ?? MODULE_HUB_META.finance!;
}

/** Rotating accent styles for icon grid cards */
export const HUB_ICON_ACCENTS = [
  { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
];
