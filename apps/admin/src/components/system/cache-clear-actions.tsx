'use client';

import { useState } from 'react';
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';

export function CacheClearActions() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function clear(scope?: string) {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/performance/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: scope ?? 'all' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json?.error?.message ?? 'Clear failed');
        return;
      }
      setStatus(`Cleared ${json.data?.keysRemoved ?? 0} keys (${json.data?.scope ?? scope ?? 'all'})`);
    } catch {
      setStatus('Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache operations</CardTitle>
        <CardDescription>Invalidate cached content after bulk publishes or config changes.</CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={loading} onClick={() => clear('search')}>
            Clear search
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => clear('platform')}>
            Clear platform
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => clear('all')}>
            Clear all
          </Button>
        </div>
        {status ? <p className="mt-3 text-sm text-[var(--varnarc-subtle)]">{status}</p> : null}
      </CardHeader>
    </Card>
  );
}
