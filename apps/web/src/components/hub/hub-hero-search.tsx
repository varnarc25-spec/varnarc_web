'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Search } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  'Home Loan EMI',
  'Personal Loan',
  'SIP Calculator',
  'Credit Cards',
  'Income Tax',
];

export function HubHeroSearch({
  placeholder,
  searchPath = '/search',
  variant = 'primary',
  suggestions = DEFAULT_SUGGESTIONS,
}: {
  placeholder: string;
  searchPath?: string;
  variant?: 'primary' | 'secondary';
  suggestions?: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const isSecondary = variant === 'secondary';
  const listId = 'hub-search-suggestions';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`${searchPath}?q=${encodeURIComponent(q)}`);
  }

  const inputClass = isSecondary
    ? 'h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-[#0b1f3a] outline-none focus:ring-2 focus:ring-blue-500/25'
    : 'h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-[#0b1f3a] shadow-sm outline-none focus:ring-2 focus:ring-blue-500/30';

  const buttonClass = isSecondary
    ? 'h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
    : 'h-12 shrink-0 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700';

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="relative flex-1 min-w-0">
        <Search
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
            isSecondary ? 'left-3 h-4 w-4' : 'left-4 h-4 w-4'
          }`}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          aria-label="Search"
          list={suggestions.length ? listId : undefined}
        />
        {suggestions.length ? (
          <datalist id={listId}>
            {suggestions.map((term) => (
              <option key={term} value={term} />
            ))}
          </datalist>
        ) : null}
      </div>
      <button type="submit" className={buttonClass}>
        Search
      </button>
    </form>
  );
}
