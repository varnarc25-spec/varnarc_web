'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@varnarc/ui';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type EditorialSuggestion = {
  topic: string;
  vertical: 'finance' | 'construction' | 'automobile' | 'solar' | 'general';
  parentCategorySlug: string;
  categorySlug: string | null;
  categoryName: string;
  source: 'trending' | 'popular' | 'search_demand' | 'content_gap' | 'editorial';
  demandScore: number;
  searchCount?: number;
  covered: boolean;
  reason: string;
};

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  children?: Array<{ id: string; name: string; slug: string }>;
};

const SOURCE_LABEL: Record<EditorialSuggestion['source'], string> = {
  trending: 'Trending',
  popular: 'Popular',
  search_demand: 'High demand',
  content_gap: 'Content gap',
  editorial: 'Recommended',
};

type ArticleTrendingSuggestionsProps = {
  initialSuggestions?: EditorialSuggestion[];
  initialCategoryTree?: CategoryTreeNode[];
  selectedTopic?: string;
  onSelect: (suggestion: EditorialSuggestion) => void;
};

export function ArticleTrendingSuggestions({
  initialSuggestions = [],
  initialCategoryTree = [],
  selectedTopic,
  onSelect,
}: ArticleTrendingSuggestionsProps) {
  const [parentCategorySlug, setParentCategorySlug] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [source, setSource] = useState<EditorialSuggestion['source'] | 'all'>('all');
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(initialCategoryTree);
  const [suggestions, setSuggestions] = useState<EditorialSuggestion[]>(initialSuggestions);
  const [loading, setLoading] = useState(false);
  const skipInitialFetch = useRef(initialSuggestions.length > 0);

  useEffect(() => {
    if (initialCategoryTree.length) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/categories/tree`, { cache: 'no-store' });
        const json = (await res.json()) as { data?: CategoryTreeNode[] };
        if (!cancelled) setCategoryTree(Array.isArray(json.data) ? json.data : []);
      } catch {
        if (!cancelled) setCategoryTree([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCategoryTree.length]);

  const subcategories = useMemo(() => {
    if (!parentCategorySlug) return [];
    return categoryTree.find((c) => c.slug === parentCategorySlug)?.children ?? [];
  }, [categoryTree, parentCategorySlug]);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '12', source });
      if (parentCategorySlug) qs.set('parentCategorySlug', parentCategorySlug);
      if (categorySlug) qs.set('categorySlug', categorySlug);
      const res = await fetch(`/api/admin/cms/articles/editorial-suggestions?${qs.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data?: EditorialSuggestion[] };
      setSuggestions(Array.isArray(json.data) ? json.data : []);
    } catch {
      // Keep existing suggestions on failure.
    } finally {
      setLoading(false);
    }
  }, [parentCategorySlug, categorySlug, source]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    void fetchSuggestions();
  }, [fetchSuggestions]);

  const gaps = suggestions.filter((item) => !item.covered);
  const covered = suggestions.filter((item) => item.covered);

  return (
    <section className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--varnarc-ink)]">
            Trending article ideas to prepare
          </h3>
          <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
            Trending and recommended topics by default. Filter by category or subcategory to narrow
            ideas for the AI writer below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
            {gaps.length} to create
          </span>
          {covered.length ? (
            <span className="rounded-full bg-[var(--varnarc-muted)] px-2 py-1 text-[var(--varnarc-subtle)]">
              {covered.length} already covered
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Category</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
            value={parentCategorySlug}
            onChange={(e) => {
              setParentCategorySlug(e.target.value);
              setCategorySlug('');
            }}
          >
            <option value="">All categories</option>
            {categoryTree.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Subcategory</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm disabled:opacity-50"
            value={categorySlug}
            disabled={!parentCategorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            <option value="">All subcategories</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.slug}>
                {sub.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Suggestion type</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value as EditorialSuggestion['source'] | 'all')}
          >
            <option value="all">All sources (default)</option>
            <option value="trending">Trending only</option>
            <option value="popular">Popular searches</option>
            <option value="search_demand">High demand</option>
            <option value="content_gap">Content gaps</option>
            <option value="editorial">Editorial picks</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">Loading suggestions…</p>
      ) : !suggestions.length ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">
          No suggestions for this filter yet. Try another category or switch to &quot;All sources&quot;.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((item) => {
            const active = selectedTopic === item.topic;
            return (
              <button
                key={item.topic}
                type="button"
                onClick={() => onSelect(item)}
                className={`rounded-lg border p-3 text-left transition ${
                  active
                    ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]'
                    : 'border-[var(--varnarc-border)] hover:border-[var(--varnarc-brand)]/50 hover:bg-[var(--varnarc-muted)]/60'
                }`}
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--varnarc-muted)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--varnarc-brand)]">
                    {SOURCE_LABEL[item.source]}
                  </span>
                  <span className="rounded-full bg-[var(--varnarc-muted)] px-2 py-0.5 text-[10px] text-[var(--varnarc-subtle)]">
                    {item.categoryName}
                  </span>
                  {item.covered ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      Covered
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">
                      Needs article
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-[var(--varnarc-ink)]">{item.topic}</p>
                <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">{item.reason}</p>
                {item.searchCount ? (
                  <p className="mt-2 text-[10px] font-medium text-[var(--varnarc-brand)]">
                    {item.searchCount} searches
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {selectedTopic ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--varnarc-border)] pt-3">
          <span className="text-xs text-[var(--varnarc-subtle)]">
            Selected: <strong className="text-[var(--varnarc-ink)]">{selectedTopic}</strong>
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              document.getElementById('article-create-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Jump to writer
          </Button>
        </div>
      ) : null}
    </section>
  );
}
