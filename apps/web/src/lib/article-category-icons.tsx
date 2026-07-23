import type { ReactNode } from 'react';

type CategoryIconDef = {
  bg: string;
  fg: string;
  label: string;
  icon: ReactNode;
};

function Icon({ d, children }: { d?: string; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      {d ? <path d={d} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {children}
    </svg>
  );
}

/** Static placeholder icons keyed by CMS category slug (subcategory or parent). */
export const ARTICLE_CATEGORY_ICONS: Record<string, CategoryIconDef> = {
  'home-loans': {
    bg: 'bg-orange-100',
    fg: 'text-orange-600',
    label: 'Home loans',
    icon: <Icon d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />,
  },
  'personal-loans': {
    bg: 'bg-violet-100',
    fg: 'text-violet-600',
    label: 'Personal loans',
    icon: <Icon d="M21 12V7H3v5M7 12v5M17 12v5M5 7V5h14v2" />,
  },
  'car-loans': {
    bg: 'bg-sky-100',
    fg: 'text-sky-600',
    label: 'Car loans',
    icon: (
      <Icon>
        <path d="M5 17h14M5 17a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 17l-1-4.5M19 17l1-4.5M7 9l1.5-4h7L17 9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7.5" cy="15" r="1" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="15" r="1" fill="currentColor" stroke="none" />
      </Icon>
    ),
  },
  'education-loans': {
    bg: 'bg-emerald-100',
    fg: 'text-emerald-600',
    label: 'Education loans',
    icon: <Icon d="M12 4 3 8.5 12 13l9-4.5L12 4zM5 10.5V16l7 3.5 7-3.5v-5.5" />,
  },
  'tax-planning': {
    bg: 'bg-amber-100',
    fg: 'text-amber-700',
    label: 'Tax planning',
    icon: <Icon d="M9 7h6M9 11h6M9 15h4M6 4h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z" />,
  },
  insurance: {
    bg: 'bg-rose-100',
    fg: 'text-rose-600',
    label: 'Insurance',
    icon: <Icon d="M12 3 4 7v6c0 5 3.5 8 8 8s8-3 8-8V7l-8-4z" />,
  },
  investments: {
    bg: 'bg-teal-100',
    fg: 'text-teal-600',
    label: 'Investments',
    icon: <Icon d="M4 18V8M10 18V5M16 18v-7M22 18H2" />,
  },
  'calculator-guides': {
    bg: 'bg-slate-200',
    fg: 'text-slate-700',
    label: 'Calculator guides',
    icon: <Icon d="M7 3h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2zM9 8h6M9 12h4" />,
  },
  finance: {
    bg: 'bg-orange-50',
    fg: 'text-orange-500',
    label: 'Finance',
    icon: <Icon d="M12 3v18M8 7h8a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4h6" />,
  },
  'home-construction': {
    bg: 'bg-stone-200',
    fg: 'text-stone-700',
    label: 'Home & construction',
    icon: <Icon d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5" />,
  },
  automobiles: {
    bg: 'bg-blue-100',
    fg: 'text-blue-600',
    label: 'Automobiles',
    icon: (
      <Icon>
        <path d="M5 16h14l-1.2-4H6.2L5 16zM7 16a1.5 1.5 0 1 0 0 .01M17 16a1.5 1.5 0 1 0 0 .01M8 12V9h8v3" strokeLinecap="round" strokeLinejoin="round" />
      </Icon>
    ),
  },
  'solar-energy': {
    bg: 'bg-yellow-100',
    fg: 'text-yellow-700',
    label: 'Solar & energy',
    icon: <Icon d="M12 3v2M12 19v2M4.2 5.2l1.4 1.4M18.4 17.4l1.4 1.4M3 12h2M19 12h2M5.2 18.4l1.4-1.4M17.4 6.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  },
  tools: {
    bg: 'bg-indigo-100',
    fg: 'text-indigo-600',
    label: 'Tools',
    icon: <Icon d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-3.2-3.2 2.1-2.1z" />,
  },
  default: {
    bg: 'bg-slate-100',
    fg: 'text-slate-600',
    label: 'Article',
    icon: <Icon d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM9 12h6M9 16h4" />,
  },
};

export function getCategoryIconDef(categorySlug?: string | null): CategoryIconDef {
  if (!categorySlug) return ARTICLE_CATEGORY_ICONS.default!;
  return ARTICLE_CATEGORY_ICONS[categorySlug] ?? ARTICLE_CATEGORY_ICONS.default!;
}

export function resolveCategorySlugForIcon(
  category?: { slug: string; parent?: { slug: string } | null } | null,
): string | null {
  if (!category) return null;
  // Prefer subcategory slug when present (child has parent).
  if (category.parent) return category.slug;
  return category.slug;
}

export function resolveArticleImageUrl(article: {
  featuredImage?: { url?: string | null; secureUrl?: string | null } | null;
}): string | null {
  const img = article.featuredImage;
  if (!img) return null;
  return img.secureUrl || img.url || null;
}
