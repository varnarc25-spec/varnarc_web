'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type AutocompletePayload = {
  keywords?: string[];
  titles?: Array<{ title: string; url: string; entityType: string; category?: string | null }>;
  categories?: string[];
};

export function SearchAutocomplete({
  initialQuery = '',
  inputId = 'search-q',
  placeholder = 'Search across Varnarc…',
}: {
  initialQuery?: string;
  inputId?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AutocompletePayload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      return;
    }
    timer.current = setTimeout(() => {
      setLoading(true);
      void fetch(`/api/search/autocomplete?q=${encodeURIComponent(term)}&limit=10`)
        .then(async (res) => {
          const json = (await res.json().catch(() => ({}))) as { data?: AutocompletePayload };
          setData(json.data ?? null);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  function submit(term = q) {
    const value = term.trim();
    setOpen(false);
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          id={inputId}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => data && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--varnarc-brand)]"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-md bg-[var(--varnarc-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--vn-hover)]"
        >
          Search
        </button>
      </form>

      {open && (data || loading) ? (
        <div className="absolute z-40 mt-2 w-full rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-3 shadow-lg">
          {loading ? <p className="text-sm text-[var(--varnarc-subtle)]">Searching…</p> : null}
          {data?.titles?.length ? (
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase text-[var(--varnarc-subtle)]">Titles</p>
              <ul className="space-y-1">
                {data.titles.map((t) => (
                  <li key={`${t.entityType}-${t.url}`}>
                    <Link
                      href={t.url}
                      className="block rounded px-2 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
                      onClick={() => setOpen(false)}
                    >
                      {t.title}
                      <span className="ml-2 text-xs text-[var(--varnarc-subtle)]">{t.entityType}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data?.keywords?.length ? (
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase text-[var(--varnarc-subtle)]">Keywords</p>
              <ul className="flex flex-wrap gap-2">
                {data.keywords.map((k) => (
                  <li key={k}>
                    <button
                      type="button"
                      className="rounded-md border border-[var(--varnarc-border)] px-2 py-1 text-xs hover:bg-[var(--varnarc-muted)]"
                      onClick={() => submit(k)}
                    >
                      {k}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {data?.categories?.length ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-[var(--varnarc-subtle)]">Categories</p>
              <ul className="flex flex-wrap gap-2">
                {data.categories.map((c) => (
                  <li key={c}>
                    <Link
                      href={`/search?q=${encodeURIComponent(c)}&category=${encodeURIComponent(c)}`}
                      className="rounded-md border border-[var(--varnarc-border)] px-2 py-1 text-xs hover:bg-[var(--varnarc-muted)]"
                      onClick={() => setOpen(false)}
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {!loading && !data?.titles?.length && !data?.keywords?.length ? (
            <p className="text-sm text-[var(--varnarc-subtle)]">No suggestions</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
