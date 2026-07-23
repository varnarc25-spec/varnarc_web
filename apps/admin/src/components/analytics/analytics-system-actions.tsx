'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AnalyticsSystemActions() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function aggregate() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/aggregate', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || 'Aggregation failed');
      setMessage('Aggregation completed.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Aggregation failed');
    } finally {
      setLoading(false);
    }
  }

  async function recordLatency() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics/system/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricName: 'api.response_ms', metricValue: Math.round(Math.random() * 200 + 20) }),
      });
      if (!res.ok) throw new Error('Failed to record metric');
      setMessage('Sample system metric recorded.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={loading} onClick={() => void aggregate()}>
        Run aggregation
      </Button>
      <Button type="button" variant="secondary" disabled={loading} onClick={() => void recordLatency()}>
        Record sample metric
      </Button>
      {message ? <p className="w-full text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
