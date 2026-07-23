'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AdsenseImportForm() {
  const [revenue30d, setRevenue30d] = useState('');
  const [impressions30d, setImpressions30d] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/adsense/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenue30d: Number(revenue30d) || 0,
          impressions30d: impressions30d ? Number(impressions30d) : undefined,
          currency: 'INR',
          source: 'manual',
          notes: notes || null,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Import failed');
      setMessage('AdSense snapshot saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-lg border border-[var(--varnarc-border)] p-4">
      <h3 className="text-sm font-semibold">Import AdSense revenue (30 days)</h3>
      <p className="text-xs text-[var(--varnarc-subtle)]">
        Manual fallback when API sync is unavailable. Use &quot;Sync from Google AdSense API&quot; when OAuth is configured.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Revenue (INR)</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            type="number"
            min={0}
            step="0.01"
            value={revenue30d}
            onChange={(e) => setRevenue30d(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Impressions</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            type="number"
            min={0}
            value={impressions30d}
            onChange={(e) => setImpressions30d(e.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Notes</span>
        <input
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. imported from AdSense CSV"
        />
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save snapshot'}
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </form>
  );
}
