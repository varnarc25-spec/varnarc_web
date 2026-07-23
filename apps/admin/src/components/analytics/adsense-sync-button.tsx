'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AdsenseSyncButton({ configured }: { configured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!configured) {
    return (
      <p className="text-xs text-[var(--varnarc-subtle)]">
        Live sync unavailable — set AdSense OAuth env vars on the API service.
      </p>
    );
  }

  async function sync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/adsense/sync', { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Sync failed');
      setMessage('AdSense synced from Google API');
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" disabled={loading} onClick={() => void sync()}>
        {loading ? 'Syncing…' : 'Sync from Google AdSense API'}
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
