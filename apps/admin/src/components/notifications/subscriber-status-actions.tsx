'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';

export function SubscriberStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function update(next: 'subscribed' | 'unsubscribed') {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: next,
          reason: next === 'unsubscribed' ? 'Admin opt-out' : 'Admin re-subscribe',
          notify: true,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setMessage(next === 'unsubscribed' ? 'Opted out.' : 'Re-subscribed.');
      router.refresh();
    } catch {
      setMessage('Could not update status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'subscribed' ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void update('unsubscribed')}
        >
          {busy ? '…' : 'Opt out'}
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={busy} onClick={() => void update('subscribed')}>
          {busy ? '…' : 'Re-subscribe'}
        </Button>
      )}
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </div>
  );
}
