'use client';

import {
  ARTICLE_STYLES,
  ARTICLE_TYPES,
  type ArticleStyle,
  type ArticleType,
} from '@varnarc/validation';

const TYPE_LABELS: Record<ArticleType, string> = {
  GENERAL: 'General',
  GUIDE: 'Guide',
  CALCULATOR_GUIDE: 'Calculator guide',
  COMPARISON: 'Comparison',
  HOW_TO: 'How-to',
  RATES: 'Rates',
  ELIGIBILITY: 'Eligibility',
  NEWS: 'News',
};

const STYLE_LABELS: Record<ArticleStyle, string> = {
  default: 'Default',
  'finance-guide': 'Finance guide',
  'calculator-guide': 'Calculator guide',
  comparison: 'Comparison',
  'automobile-guide': 'Automobile guide',
  'construction-guide': 'Construction guide',
};

const TYPE_TO_STYLE: Partial<Record<ArticleType, ArticleStyle>> = {
  CALCULATOR_GUIDE: 'calculator-guide',
  COMPARISON: 'comparison',
  GUIDE: 'finance-guide',
};

export function ArticleTypeSelector({
  articleType,
  articleStyle,
  customCssClass,
  onChange,
}: {
  articleType: ArticleType;
  articleStyle: ArticleStyle;
  customCssClass: string;
  onChange: (next: {
    articleType: ArticleType;
    articleStyle: ArticleStyle;
    customCssClass: string;
  }) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Article type</span>
        <select
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={articleType}
          onChange={(e) => {
            const nextType = e.target.value as ArticleType;
            onChange({
              articleType: nextType,
              articleStyle: TYPE_TO_STYLE[nextType] || articleStyle,
              customCssClass,
            });
          }}
        >
          {ARTICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Article style</span>
        <select
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={articleStyle}
          onChange={(e) =>
            onChange({
              articleType,
              articleStyle: e.target.value as ArticleStyle,
              customCssClass,
            })
          }
        >
          {ARTICLE_STYLES.map((style) => (
            <option key={style} value={style}>
              {STYLE_LABELS[style]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Custom CSS class</span>
        <input
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={customCssClass}
          placeholder="optional-slug-class"
          onChange={(e) =>
            onChange({
              articleType,
              articleStyle,
              customCssClass: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            })
          }
        />
      </label>
    </div>
  );
}
