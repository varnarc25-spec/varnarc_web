export type EditorialVertical = 'finance' | 'construction' | 'automobile' | 'solar' | 'general';

export type EditorialSuggestionSource =
  | 'trending'
  | 'popular'
  | 'search_demand'
  | 'content_gap'
  | 'editorial';

export type EditorialSuggestion = {
  topic: string;
  vertical: EditorialVertical;
  parentCategorySlug: string;
  categorySlug: string | null;
  categoryName: string;
  source: EditorialSuggestionSource;
  demandScore: number;
  searchCount?: number;
  covered: boolean;
  reason: string;
};

export const PARENT_CATEGORY_SLUGS = [
  'finance',
  'home-construction',
  'automobiles',
  'solar-energy',
  'tools',
] as const;

export const CATEGORY_SLUG_LABELS: Record<string, string> = {
  finance: 'Finance',
  'home-construction': 'Home & Construction',
  automobiles: 'Automobiles',
  'solar-energy': 'Solar & Energy',
  tools: 'Tools & Calculators',
  'home-loans': 'Home Loans',
  'personal-loans': 'Personal Loans',
  'car-loans': 'Car Loans',
  'education-loans': 'Education Loans',
  'tax-planning': 'Tax Planning',
  insurance: 'Insurance',
  investments: 'Investments',
  'calculator-guides': 'Calculator Guides',
};

const VERTICAL_TO_PARENT: Record<EditorialVertical, string> = {
  finance: 'finance',
  construction: 'home-construction',
  automobile: 'automobiles',
  solar: 'solar-energy',
  general: 'tools',
};

const EDITORIAL_SEEDS: Array<{
  topic: string;
  vertical: EditorialVertical;
  categorySlug?: string | null;
  reason: string;
  demandScore: number;
}> = [
  {
    topic: 'Home loan prepayment vs EMI reduction: which saves more interest?',
    vertical: 'finance',
    categorySlug: 'home-loans',
    reason: 'High-intent finance comparison readers search for',
    demandScore: 90,
  },
  {
    topic: 'How to calculate home loan EMI and plan affordability in 2026',
    vertical: 'finance',
    categorySlug: 'home-loans',
    reason: 'Core calculator + guide traffic driver',
    demandScore: 88,
  },
  {
    topic: 'Best tax-saving investments under Section 80C for salaried employees',
    vertical: 'finance',
    categorySlug: 'tax-planning',
    reason: 'Seasonal tax-planning demand',
    demandScore: 85,
  },
  {
    topic: 'House construction cost per sq ft in India: city-wise breakdown',
    vertical: 'construction',
    reason: 'Top construction planning query',
    demandScore: 86,
  },
  {
    topic: 'Vastu tips for new home buyers: practical room-by-room guide',
    vertical: 'construction',
    reason: 'Home buyer content gap',
    demandScore: 78,
  },
  {
    topic: 'Electric car vs petrol car: total cost of ownership in India',
    vertical: 'automobile',
    categorySlug: 'car-loans',
    reason: 'EV adoption comparison trend',
    demandScore: 84,
  },
  {
    topic: 'Car maintenance checklist for monsoon season in India',
    vertical: 'automobile',
    reason: 'Seasonal automobile guide',
    demandScore: 76,
  },
  {
    topic: 'Rooftop solar subsidy and payback period explained for homeowners',
    vertical: 'solar',
    reason: 'Growing solar search interest',
    demandScore: 82,
  },
  {
    topic: 'How to choose the right inverter and battery for home solar',
    vertical: 'solar',
    reason: 'Solar equipment buyer guide',
    demandScore: 80,
  },
  {
    topic: 'Personal loan vs credit card EMI: when to use which',
    vertical: 'finance',
    categorySlug: 'personal-loans',
    reason: 'Common borrowing decision query',
    demandScore: 83,
  },
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectVertical(topic: string): EditorialVertical {
  const text = normalizeText(topic);
  if (/\b(solar|inverter|rooftop|panel|subsidy|kwh)\b/.test(text)) return 'solar';
  if (/\b(car|vehicle|automobile|ev|petrol|diesel|bike|scooter)\b/.test(text)) return 'automobile';
  if (/\b(home|house|construction|interior|renovation|vastu|cement|tile)\b/.test(text)) {
    return 'construction';
  }
  if (/\b(loan|emi|tax|sip|insurance|investment|credit|mutual|nps|ppf)\b/.test(text)) {
    return 'finance';
  }
  return 'general';
}

function detectSubcategorySlug(topic: string, parentCategorySlug: string): string | null {
  const text = normalizeText(topic);

  if (parentCategorySlug === 'finance') {
    if (/\b(home loan|housing loan|mortgage|property loan)\b/.test(text)) return 'home-loans';
    if (/\b(personal loan)\b/.test(text)) return 'personal-loans';
    if (/\b(car loan|auto loan|vehicle loan)\b/.test(text)) return 'car-loans';
    if (/\b(education loan|student loan)\b/.test(text)) return 'education-loans';
    if (/\b(tax|gst|itr|section 80|deduction|income tax)\b/.test(text)) return 'tax-planning';
    if (/\b(insurance|term plan|health plan|life cover)\b/.test(text)) return 'insurance';
    if (/\b(sip|mutual fund|nps|ppf|investment|retirement|wealth)\b/.test(text)) return 'investments';
    if (/\b(home loan|emi calculator|loan eligibility)\b/.test(text)) return 'home-loans';
    if (/\b(loan|emi)\b/.test(text)) return 'home-loans';
  }

  if (parentCategorySlug === 'tools') {
    if (/\b(calculator|emi|gst|sip|paint|tile|budget)\b/.test(text)) return 'calculator-guides';
  }

  return null;
}

function resolveCategoryMeta(
  topic: string,
  vertical: EditorialVertical,
  explicitCategorySlug?: string | null,
): Pick<EditorialSuggestion, 'parentCategorySlug' | 'categorySlug' | 'categoryName'> {
  const parentCategorySlug = VERTICAL_TO_PARENT[vertical];
  const categorySlug = explicitCategorySlug ?? detectSubcategorySlug(topic, parentCategorySlug);
  const categoryName = categorySlug
    ? (CATEGORY_SLUG_LABELS[categorySlug] ?? categorySlug)
    : (CATEGORY_SLUG_LABELS[parentCategorySlug] ?? parentCategorySlug);

  return { parentCategorySlug, categorySlug, categoryName };
}

function isTopicCovered(
  topic: string,
  articles: Array<{ title: string; slug: string }>,
): boolean {
  const phrase = normalizeText(topic);
  if (!phrase) return false;

  const corpus = articles
    .map((article) => `${normalizeText(article.title)} ${normalizeText(article.slug)}`)
    .join(' ');

  if (corpus.includes(phrase)) return true;

  const words = phrase.split(' ').filter((word) => word.length > 3);
  if (!words.length) return false;

  const matched = words.filter((word) => corpus.includes(word));
  const threshold = Math.min(2, words.length);
  return matched.length >= threshold;
}

function upsertSuggestion(
  map: Map<string, EditorialSuggestion>,
  input: {
    topic: string;
    vertical?: EditorialVertical;
    categorySlug?: string | null;
    source: EditorialSuggestionSource;
    demandScore: number;
    searchCount?: number;
    covered?: boolean;
    reason: string;
  },
  articles: Array<{ title: string; slug: string }>,
) {
  const topic = input.topic.trim();
  if (!topic) return;

  const vertical = input.vertical ?? detectVertical(topic);
  const categoryMeta = resolveCategoryMeta(topic, vertical, input.categorySlug);
  const key = normalizeText(topic);
  const covered = input.covered ?? isTopicCovered(topic, articles);
  const existing = map.get(key);

  if (!existing || input.demandScore > existing.demandScore) {
    map.set(key, {
      topic,
      vertical,
      ...categoryMeta,
      source: input.source,
      demandScore: input.demandScore,
      searchCount: input.searchCount,
      covered,
      reason: input.reason,
    });
  }
}

export function buildEditorialSuggestions(input: {
  articles: Array<{ title: string; slug: string }>;
  trending: Array<{ keyword: string; searchCount: number }>;
  popular: Array<{ keyword: string; searchCount: number }>;
  topQueries: Array<{ query: string; count: number }>;
  zeroResultQueries: Array<{ query: string }>;
  limit?: number;
  parentCategorySlug?: string;
  categorySlug?: string;
  source?: EditorialSuggestionSource | 'all';
}): EditorialSuggestion[] {
  const map = new Map<string, EditorialSuggestion>();
  const limit = input.limit ?? 12;
  const sourceFilter = input.source ?? 'all';

  for (const row of input.trending) {
    upsertSuggestion(
      map,
      {
        topic: row.keyword,
        source: 'trending',
        demandScore: 70 + Math.min(row.searchCount, 30),
        searchCount: row.searchCount,
        reason: `Trending search (${row.searchCount} searches this week)`,
      },
      input.articles,
    );
  }

  for (const row of input.popular) {
    upsertSuggestion(
      map,
      {
        topic: row.keyword,
        source: 'popular',
        demandScore: 60 + Math.min(row.searchCount, 40),
        searchCount: row.searchCount,
        reason: `Popular search (${row.searchCount} total searches)`,
      },
      input.articles,
    );
  }

  for (const row of input.topQueries) {
    upsertSuggestion(
      map,
      {
        topic: row.query,
        source: 'search_demand',
        demandScore: 55 + Math.min(row.count * 3, 35),
        searchCount: row.count,
        reason: `Users searched ${row.count} times in the last 30 days`,
      },
      input.articles,
    );
  }

  for (const row of input.zeroResultQueries) {
    upsertSuggestion(
      map,
      {
        topic: row.query,
        source: 'content_gap',
        demandScore: 95,
        reason: 'Users searched but found no results — content gap',
      },
      input.articles,
    );
  }

  for (const seed of EDITORIAL_SEEDS) {
    upsertSuggestion(
      map,
      {
        topic: seed.topic,
        vertical: seed.vertical,
        categorySlug: seed.categorySlug,
        source: 'editorial',
        demandScore: seed.demandScore,
        reason: seed.reason,
      },
      input.articles,
    );
  }

  let results = [...map.values()];

  if (sourceFilter !== 'all') {
    results = results.filter((row) => row.source === sourceFilter);
  }

  if (input.parentCategorySlug) {
    results = results.filter((row) => row.parentCategorySlug === input.parentCategorySlug);
  }

  if (input.categorySlug) {
    results = results.filter((row) => row.categorySlug === input.categorySlug);
  }

  return results
    .sort((a, b) => {
      if (a.covered !== b.covered) return a.covered ? 1 : -1;
      if (a.source === 'content_gap' && b.source !== 'content_gap') return -1;
      if (b.source === 'content_gap' && a.source !== 'content_gap') return 1;
      return b.demandScore - a.demandScore;
    })
    .slice(0, limit);
}
