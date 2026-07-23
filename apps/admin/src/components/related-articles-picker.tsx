'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

type ArticleOption = {
  id: string;
  title: string;
  slug: string;
};

export function RelatedArticlesPicker({
  value,
  onChange,
  excludeId,
  initialLabels = {},
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
  initialLabels?: Record<string, string>;
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<ArticleOption[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>(initialLabels);

  useEffect(() => {
    setSelectedLabels((prev) => ({ ...initialLabels, ...prev }));
  }, [initialLabels]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ limit: '15' });
        if (search.trim()) qs.set('search', search.trim());
        const res = await fetch(`/api/admin/cms/articles/list?${qs.toString()}`);
        const json = (await res.json()) as { data?: ArticleOption[] };
        if (!cancelled) {
          setOptions(
            (Array.isArray(json.data) ? json.data : []).filter((a) => a.id !== excludeId),
          );
        }
      } catch {
        if (!cancelled) setOptions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, excludeId]);

  function toggle(item: ArticleOption) {
    if (value.includes(item.id)) {
      onChange(value.filter((id) => id !== item.id));
      return;
    }
    setSelectedLabels((prev) => ({ ...prev, [item.id]: item.title }));
    onChange([...value, item.id]);
  }

  return (
    <div className="space-y-2">
      <input
        className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
        placeholder="Search articles to relate…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {value.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <button
              key={id}
              type="button"
              className="rounded-full border border-[var(--varnarc-border)] px-3 py-1 text-xs hover:border-red-400"
              onClick={() => onChange(value.filter((x) => x !== id))}
              title="Remove"
            >
              {selectedLabels[id] || id.slice(0, 8)} ×
            </button>
          ))}
        </div>
      ) : null}
      <ul className="max-h-40 overflow-auto rounded-md border border-[var(--varnarc-border)]">
        {options.map((item) => {
          const active = value.includes(item.id);
          return (
            <li key={item.id}>
              <Button
                type="button"
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start rounded-none"
                onClick={() => toggle(item)}
              >
                {active ? '✓ ' : ''}
                {item.title}
              </Button>
            </li>
          );
        })}
        {!options.length ? (
          <li className="px-3 py-2 text-sm text-[var(--varnarc-subtle)]">No matches</li>
        ) : null}
      </ul>
    </div>
  );
}
