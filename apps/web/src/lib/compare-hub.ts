export type CompareCategoryKey = 'finance' | 'cars' | 'home' | 'solar' | 'products';

export type ComparePreviewRow = {
  label: string;
  optionA: string;
  optionB: string;
};

export type CompareCard = {
  id: string;
  href: string;
  title: string;
  category: CompareCategoryKey;
  optionA: string;
  optionB: string;
  dimensions: string[];
  previewRows?: ComparePreviewRow[];
};

export type BuilderOption = {
  id: string;
  label: string;
  group: string;
  sortValue?: number | null;
  preview?: Array<{ label: string; value: string }>;
};

export type BuilderCategory = {
  key: CompareCategoryKey;
  label: string;
  hint: string;
  options: BuilderOption[];
};

export const COMPARE_CATEGORY_META: Record<
  CompareCategoryKey,
  {
    label: string;
    badge: string;
    href: string;
    description: string;
    dimensions: string[];
    cta: string;
  }
> = {
  finance: {
    label: 'Finance',
    badge: 'Finance',
    href: '/finance/compare',
    description: 'Compare loans, rates, fees, tenure and financial products.',
    dimensions: ['Rate range', 'Processing fee', 'Tenure', 'Loan type'],
    cta: 'Compare finance',
  },
  cars: {
    label: 'Cars',
    badge: 'Automobile',
    href: '/automobile/compare',
    description: 'Compare price, mileage, specifications, safety and ownership costs.',
    dimensions: ['Price', 'Mileage', 'Fuel', 'Transmission'],
    cta: 'Compare cars',
  },
  home: {
    label: 'Home & Construction',
    badge: 'Home & Construction',
    href: '/construction/compare',
    description: 'Compare materials, methods, costs, durability and applications.',
    dimensions: ['Cost', 'Strength', 'Durability', 'Use case'],
    cta: 'Compare construction',
  },
  solar: {
    label: 'Solar',
    badge: 'Solar',
    href: '/solar',
    description: 'Compare panels, technologies, output, efficiency and payback.',
    dimensions: ['Efficiency', 'Temperature performance', 'Cost', 'Degradation'],
    cta: 'Compare solar',
  },
  products: {
    label: 'Products',
    badge: 'Products',
    href: '/compare/products',
    description: 'Appliances and other structured products.',
    dimensions: ['Price', 'Features', 'Warranty'],
    cta: 'Compare products',
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

export function comparableOptions(options: BuilderOption[], selectedId: string) {
  const selected = options.find((option) => option.id === selectedId);
  if (!selected) return [];

  return options
    .filter((option) => option.id !== selected.id && option.group === selected.group)
    .sort((left, right) => {
      if (selected.sortValue == null || left.sortValue == null || right.sortValue == null) {
        return left.label.localeCompare(right.label);
      }
      return (
        Math.abs(left.sortValue - selected.sortValue) -
        Math.abs(right.sortValue - selected.sortValue)
      );
    });
}

export function comparisonPreview(optionA?: BuilderOption, optionB?: BuilderOption) {
  if (!optionA || !optionB) return [];
  const right = new Map((optionB.preview ?? []).map((item) => [item.label, item.value]));
  return (optionA.preview ?? [])
    .flatMap((item) => {
      const valueB = right.get(item.label);
      return valueB ? [{ label: item.label, optionA: item.value, optionB: valueB }] : [];
    })
    .slice(0, 5);
}

export function normalizeCompareLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function canonicalPairOrder(a: string, b: string): [string, string] {
  return normalizeCompareLabel(a) <= normalizeCompareLabel(b) ? [a, b] : [b, a];
}

export function matchComparisonCards(cards: CompareCard[], query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const pair = parseVsTitle(query);
  if (pair) {
    const a = normalizeCompareLabel(pair.a);
    const b = normalizeCompareLabel(pair.b);
    const vsMatches = cards.filter((card) => {
      const left = normalizeCompareLabel(card.optionA);
      const right = normalizeCompareLabel(card.optionB);
      return (left.includes(a) && right.includes(b)) || (left.includes(b) && right.includes(a));
    });
    if (vsMatches.length) return vsMatches.slice(0, 8);
  }
  return cards
    .filter((card) =>
      `${card.title} ${card.optionA} ${card.optionB} ${card.category}`.toLowerCase().includes(q),
    )
    .slice(0, 8);
}

export function featuredPairFromCatalog(catalog: BuilderCategory): CompareCard | null {
  const optionA = catalog.options[0];
  if (!optionA) return null;
  const optionB = comparableOptions(catalog.options, optionA.id)[0];
  if (!optionB) return null;
  const previewRows = comparisonPreview(optionA, optionB);
  return {
    id: `${catalog.key}-${optionA.id}-${optionB.id}`,
    href: builderCompareHref(catalog.key, optionA.id, optionB.id, optionA.group),
    title: `${optionA.label} vs ${optionB.label}`,
    category: catalog.key,
    optionA: optionA.label,
    optionB: optionB.label,
    dimensions: COMPARE_CATEGORY_META[catalog.key].dimensions,
    previewRows,
  };
}

export function attachPreviewToCard(card: CompareCard, catalogs: BuilderCategory[]): CompareCard {
  if (card.previewRows?.length) return card;
  const catalog = catalogs.find((item) => item.key === card.category);
  if (!catalog) return card;
  const optionA = catalog.options.find((item) =>
    normalizeCompareLabel(item.label).includes(normalizeCompareLabel(card.optionA).slice(0, 18)),
  );
  const optionB = catalog.options.find((item) =>
    normalizeCompareLabel(item.label).includes(normalizeCompareLabel(card.optionB).slice(0, 18)),
  );
  if (!optionA || !optionB || optionA.id === optionB.id) return card;
  return { ...card, previewRows: comparisonPreview(optionA, optionB) };
}

export function differingPreviewRows(rows: ComparePreviewRow[]) {
  return rows.filter(
    (row) => normalizeCompareLabel(row.optionA) !== normalizeCompareLabel(row.optionB),
  );
}

export function compareHubIsIndexable(search?: { q?: string; category?: string }) {
  return !search?.q?.trim() && !search?.category?.trim();
}
