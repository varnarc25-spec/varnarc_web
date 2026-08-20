export type CompareCategoryKey = 'finance' | 'cars' | 'home' | 'solar' | 'products';

export type CompareCard = {
  id: string;
  href: string;
  title: string;
  category: CompareCategoryKey;
  optionA: string;
  optionB: string;
  dimensions: string[];
};

export type BuilderOption = {
  id: string;
  label: string;
  group: string;
};

export type BuilderCategory = {
  key: CompareCategoryKey;
  label: string;
  hint: string;
  options: BuilderOption[];
};

export const COMPARE_CATEGORY_META: Record<
  CompareCategoryKey,
  { label: string; badge: string; href: string; description: string; dimensions: string[] }
> = {
  finance: {
    label: 'Finance',
    badge: 'Finance',
    href: '/finance/compare',
    description: 'Loans, cards, deposits and other financial options.',
    dimensions: ['Rates', 'Fees', 'Tenure'],
  },
  cars: {
    label: 'Cars',
    badge: 'Automobile',
    href: '/automobile/compare',
    description: 'Models, variants and ownership choices.',
    dimensions: ['Price', 'Mileage', 'Features'],
  },
  home: {
    label: 'Home & Construction',
    badge: 'Home & Construction',
    href: '/construction/compare',
    description: 'Materials, methods and home products.',
    dimensions: ['Cost', 'Strength', 'Use case'],
  },
  solar: {
    label: 'Solar',
    badge: 'Solar',
    href: '/solar',
    description: 'Panels, technologies and system options.',
    dimensions: ['Efficiency', 'Cost', 'Degradation'],
  },
  products: {
    label: 'Products',
    badge: 'Products',
    href: '/compare/products',
    description: 'Appliances and other structured products.',
    dimensions: ['Price', 'Features', 'Warranty'],
  },
};

const UNLIKE_PAIRS: Array<[RegExp, RegExp]> = [
  [/cement|opc/, /tmt|steel|rebar/],
  [/brick|block|aac/, /cement|opc|tmt|steel/],
  [/sand|m-sand|msand/, /cement|steel|brick/],
  [/personal loan/, /home loan|housing loan/],
  [/credit card/, /home loan|personal loan/],
];

export function parseVsTitle(title: string): { a: string; b: string } | null {
  const parts = title
    .split(/\s+vs\.?\s+|\s+versus\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  return { a: parts[0]!, b: parts.slice(1).join(' vs ') };
}

export function looksUnlikeForLike(a: string, b: string): boolean {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return UNLIKE_PAIRS.some(
    ([one, two]) => (one.test(left) && two.test(right)) || (two.test(left) && one.test(right)),
  );
}

export function classifyComparisonText(text: string): CompareCategoryKey | 'other' {
  const hay = text.toLowerCase();
  if (/loan|credit card|fd\b|rd\b|sip|invest|insurance|emi|nbfc|bank|deposit/.test(hay)) {
    return 'finance';
  }
  if (/car|suv|sedan|hatch|vehicle|mileage|hyundai|kia|honda|maruti|tata|mahindra/.test(hay)) {
    return 'cars';
  }
  if (/solar|topcon|perc|photovoltaic|inverter|mono perc|polycrystalline/.test(hay)) {
    return 'solar';
  }
  if (/cement|brick|aac|tmt|sand|steel|paint|tile|plywood|construction|concrete|block/.test(hay)) {
    return 'home';
  }
  if (/appliance|television|\btv\b|\bac\b|fridge|washing|product/.test(hay)) {
    return 'products';
  }
  return 'other';
}

export function builderCompareHref(
  category: CompareCategoryKey,
  idA: string,
  idB: string,
  group: string,
): string {
  if (category === 'cars') return `/automobile/compare?ids=${encodeURIComponent(`${idA},${idB}`)}`;
  if (category === 'home')
    return `/construction/compare?ids=${encodeURIComponent(`${idA},${idB}`)}`;
  if (category === 'finance') {
    const type = group.startsWith('card') ? 'credit-cards' : 'loans';
    return `/finance/compare?type=${type}&ids=${encodeURIComponent(`${idA},${idB}`)}`;
  }
  return `/compare?category=${category}`;
}

export function loanGroupKey(loanType?: string | null): string {
  const raw = (loanType ?? 'loan').toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (/home|housing/.test(raw)) return 'loan:home';
  if (/personal/.test(raw)) return 'loan:personal';
  if (/car|auto|vehicle/.test(raw)) return 'loan:auto';
  if (/gold/.test(raw)) return 'loan:gold';
  if (/education|student/.test(raw)) return 'loan:education';
  if (/business|sme|msme/.test(raw)) return 'loan:business';
  if (/lap|property/.test(raw)) return 'loan:property';
  return `loan:${raw || 'general'}`;
}
