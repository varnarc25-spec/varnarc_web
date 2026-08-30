'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn, cx } from '@/components/construction/styles';
import {
  autocompleteAskCatalog,
  askResultsPath,
  resolveAskConstructionQuery,
  type AskCatalogItem,
} from '@/lib/construction/ask';
import {
  queryLengthBucket,
  resultCountBucket,
  trackAskResultClicked,
  trackAskSearchPerformed,
  trackConstructionSearchNoResult,
} from '@/lib/construction/analytics';

export function AskConstructionSearch({
  id,
  initialQuery = '',
  placeholder = 'Ask Varnarc Construction…',
  autoFocus = false,
  className,
  onRouted,
}: {
  id?: string;
  initialQuery?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onRouted?: (href: string) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputId = id ?? `ask-construction-${listId}`;
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => autocompleteAskCatalog(query, 6), [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function trackAndGo(
    href: string,
    meta: {
      intent: string;
      category: string;
      resultCount: number;
      autoRouted: boolean;
    },
  ) {
    trackAskSearchPerformed({
      intent: meta.intent,
      category: meta.category,
      result_count_bucket: resultCountBucket(meta.resultCount),
      auto_routed: meta.autoRouted,
      query_length_bucket: queryLengthBucket(query),
      path: '/construction',
    });
    if (meta.resultCount === 0) {
      trackConstructionSearchNoResult({
        surface: 'ask_construction',
        query_length_bucket: queryLengthBucket(query),
        path: '/construction/ask',
      });
    }
    onRouted?.(href);
    router.push(href);
  }

  function submit(term = query) {
    const value = term.trim();
    setOpen(false);
    if (!value) {
      trackAndGo('/construction/estimate', {
        intent: 'unknown',
        category: 'empty',
        resultCount: 0,
        autoRouted: false,
      });
      return;
    }
    const decision = resolveAskConstructionQuery(value);
    if (decision.autoRoute && decision.href) {
      trackAndGo(decision.href, {
        intent: decision.parse.intent,
        category: decision.parse.category,
        resultCount: decision.results.length,
        autoRouted: true,
      });
      return;
    }
    // Low confidence → results page (never silent guess)
    trackAndGo(askResultsPath(value), {
      intent: decision.parse.intent,
      category: decision.parse.category,
      resultCount: decision.results.length,
      autoRouted: false,
    });
  }

  function pickSuggestion(item: AskCatalogItem) {
    trackAskResultClicked({
      intent: 'autocomplete',
      result_type: item.kind,
      path: item.href,
    });
    trackAskSearchPerformed({
      intent: 'autocomplete',
      category: item.kind,
      result_count_bucket: 'few',
      auto_routed: true,
      query_length_bucket: queryLengthBucket(query),
      path: item.href,
    });
    setOpen(false);
    setQuery(item.label);
    onRouted?.(item.href);
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (
      e.key === 'Enter' &&
      activeIndex >= 0 &&
      suggestions[activeIndex] &&
      query.trim().length < 2
    ) {
      e.preventDefault();
      pickSuggestion(suggestions[activeIndex]!);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <form
        role="search"
        aria-label="Ask Varnarc Construction"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask Varnarc Construction
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id={inputId}
              value={query}
              autoFocus={autoFocus}
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={`${listId}-listbox`}
              aria-expanded={open}
              role="combobox"
              placeholder={placeholder}
              className={cn(cx.input, 'pl-10')}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActiveIndex(0);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
          </div>
          <button type="submit" className={cn(cx.primaryBtn, 'sm:px-6')}>
            Ask
          </button>
        </div>
      </form>

      {open && suggestions.length > 0 ? (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((item, index) => (
            <li key={item.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm',
                  index === activeIndex ? 'bg-slate-50' : 'hover:bg-slate-50',
                  cx.focus,
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pickSuggestion(item)}
              >
                <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {item.kind}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-[#0b1f3a]">{item.label}</span>
                  <span className="block truncate text-xs text-slate-500">{item.href}</span>
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            Press Ask to interpret your full question. Browse{' '}
            <Link
              href="/construction/guides"
              className="font-medium text-[#f97316] hover:underline"
            >
              guides
            </Link>{' '}
            anytime.
          </li>
        </ul>
      ) : null}
    </div>
  );
}
