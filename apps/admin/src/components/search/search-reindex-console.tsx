'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

const MODULES = [
  'all',
  'cms',
  'finance',
  'construction',
  'automobile',
  'directory',
  'ai-tools',
  'calculators',
  'reviews',
  'comparisons',
  'media',
  'guides',
] as const;

export function SearchReindexConsole() {
  const [module, setModule] = useState<(typeof MODULES)[number]>('all');
  const [asyncMode, setAsyncMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reindex() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/search/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, async: asyncMode }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string | { message?: string };
        data?: {
          total?: number;
          summary?: Record<string, number>;
          async?: boolean;
          jobId?: string;
          status?: string;
        };
      };
      if (!res.ok) {
        const err = typeof json.error === 'string' ? json.error : json.error?.message;
        throw new Error(err || 'Reindex failed');
      }
      if (json.data?.async && json.data.jobId) {
        setMessage(`Background job ${json.data.jobId} ${json.data.status}. Polling…`);
        await pollJob(json.data.jobId);
        return;
      }
      const summary = json.data?.summary
        ? Object.entries(json.data.summary)
            .map(([k, v]) => `${k}:${v}`)
            .join(', ')
        : '';
      setMessage(`Indexed ${json.data?.total ?? 0} documents. ${summary}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Reindex failed');
    } finally {
      setLoading(false);
    }
  }

  async function pollJob(jobId: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch(`/api/admin/search/reindex/${jobId}`);
      const json = (await res.json().catch(() => ({}))) as {
        data?: { status?: string; total?: number; summary?: Record<string, number>; error?: string };
      };
      const status = json.data?.status;
      if (status === 'completed') {
        const summary = json.data?.summary
          ? Object.entries(json.data.summary)
              .map(([k, v]) => `${k}:${v}`)
              .join(', ')
          : '';
        setMessage(`Indexed ${json.data?.total ?? 0} documents. ${summary}`);
        return;
      }
      if (status === 'failed') {
        setMessage(json.data?.error || 'Background reindex failed');
        return;
      }
      setMessage(`Job ${jobId}: ${status ?? 'running'}…`);
    }
    setMessage(`Job ${jobId} still running — check again later.`);
  }

  async function clearCache() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/search/cache/clear', { method: 'POST' });
      if (!res.ok) throw new Error('Cache clear failed');
      setMessage('Cache clear requested.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cache clear failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h2 className="font-semibold">Reindex console</h2>
      <label className="block text-sm">
        Module
        <select
          className="mt-1 h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3"
          value={module}
          onChange={(e) => setModule(e.target.value as (typeof MODULES)[number])}
        >
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={asyncMode}
          onChange={(e) => setAsyncMode(e.target.checked)}
        />
        Run in background
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={loading} onClick={() => void reindex()}>
          {loading ? 'Working…' : 'Run reindex'}
        </Button>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void clearCache()}>
          Clear cache
        </Button>
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
