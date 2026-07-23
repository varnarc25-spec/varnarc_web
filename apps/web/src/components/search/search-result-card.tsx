'use client';

import Link from 'next/link';

type Item = {
  entityType: string;
  entityId: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  location?: string | null;
  author?: string | null;
  brand?: string | null;
  tags?: string | null;
  publishedAt?: string | null;
  rating?: number | null;
  highlighted?: string | null;
  url: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  verified?: boolean;
};

export function SearchResultCard({ item, queryId }: { item: Item; queryId?: string | null }) {
  async function onClick() {
    if (!queryId) return;
    void fetch('/api/search/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queryId,
        entityType: item.entityType,
        entityId: item.entityId,
        url: item.url,
      }),
    });
  }

  return (
    <article className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--varnarc-subtle)]">
        <span>{item.entityType}</span>
        {item.category ? <span>· {item.category}</span> : null}
        {item.location ? <span>· {item.location}</span> : null}
        {item.brand ? <span>· {item.brand}</span> : null}
        {item.author ? <span>· {item.author}</span> : null}
        {item.featured ? <span className="text-[var(--varnarc-brand)]">Featured</span> : null}
        {item.sponsored ? <span>Sponsored</span> : null}
        {item.verified ? <span>Verified</span> : null}
        {item.rating != null ? <span>★ {item.rating.toFixed(1)}</span> : null}
      </div>
      <Link
        href={item.url}
        onClick={() => void onClick()}
        className="text-lg font-semibold text-[var(--varnarc-brand)] hover:underline"
      >
        {item.seoTitle || item.title}
      </Link>
      {item.tags ? <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">{item.tags}</p> : null}
      {item.highlighted ? (
        <p
          className="mt-2 text-sm text-[var(--varnarc-subtle)] [&_mark]:bg-yellow-200 [&_mark]:text-[var(--varnarc-ink)]"
          dangerouslySetInnerHTML={{ __html: item.highlighted }}
        />
      ) : item.summary ? (
        <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{item.summary}</p>
      ) : null}
    </article>
  );
}
