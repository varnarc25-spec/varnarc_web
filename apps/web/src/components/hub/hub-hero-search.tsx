'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Search } from 'lucide-react';

export function HubHeroSearch({
  placeholder,
  searchPath = '/search',
}: {
  placeholder: string;
  searchPath?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`${searchPath}?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-[#0b1f3a] shadow-sm outline-none focus:ring-2 focus:ring-blue-500/30"
          aria-label="Search"
        />
      </div>
      <button
        type="submit"
        className="h-12 shrink-0 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  );
}
