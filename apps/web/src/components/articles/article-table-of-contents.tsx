'use client';

import { useMemo } from 'react';
import type { ArticleTocItem } from '@varnarc/validation';

export function ArticleTableOfContents({ items }: { items: ArticleTocItem[] }) {
  const headings = useMemo(
    () => items.filter((item) => item.level === 2 || item.level === 3),
    [items],
  );
  if (!headings.length) return null;

  return (
    <details className="article-toc lg:open" open>
      <summary className="cursor-pointer list-none font-semibold text-sm text-[var(--article-heading,#0b1f3a)]">
        On this page
      </summary>
      <ol className="mt-3">
        {headings.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'ml-3 text-sm' : ''}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </details>
  );
}
