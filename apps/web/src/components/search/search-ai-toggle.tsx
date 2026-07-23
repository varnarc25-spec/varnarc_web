'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';
import { getApiBaseUrl } from '@/services/api-client';

export function SearchAiToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) return null;

  async function runAiSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/search/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: trimmed, limit: 20 }),
      });
      const json = (await res.json()) as {
        data?: { ai?: { interpreted?: { keywords?: string; entityType?: string | null } } };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'AI search failed');
      const keywords = json.data?.ai?.interpreted?.keywords || trimmed;
      const entityType = json.data?.ai?.interpreted?.entityType;
      const params = new URLSearchParams({ q: keywords, mode: 'ai' });
      if (entityType) params.set('type', entityType);
      router.push(`/search?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void runAiSearch(e)} className="rounded-lg border border-dashed border-[#f97316]/40 bg-orange-50/50 p-4">
      <p className="text-sm font-medium text-slate-800">Ask in plain English</p>
      <p className="mt-1 text-xs text-slate-600">
        e.g. “best home loan rates in Bangalore” or “SIP calculator for retirement”
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm"
          placeholder="Describe what you are looking for…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={loading || query.trim().length < 3}>
          {loading ? 'Searching…' : 'AI search'}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
