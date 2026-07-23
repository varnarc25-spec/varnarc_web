'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function SaveComparisonButton({ ids }: { ids: string[] }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || ids.length < 2) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/construction/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'materials',
          title: title.trim(),
          ids,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (res.status === 401) {
        setMessage('Sign in with an admin account to save comparisons.');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setMessage('Comparison saved.');
      setTitle('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-extrabold text-[#0b1f3a]">Save this comparison</h2>
      <p className="mt-1 text-sm text-slate-600">
        Store this material set for reuse on public compare pages (admin permission required).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="h-10 min-w-[220px] flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm"
          placeholder="Comparison title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button type="button" disabled={loading || !title.trim()} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Save comparison'}
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
