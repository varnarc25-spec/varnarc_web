'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CancelMembershipButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!window.confirm('Cancel your premium subscription?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/premium/cancel', { method: 'POST' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Cancel failed');
        return;
      }
      router.refresh();
    } catch {
      setError('Cancel failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void cancel()}
        disabled={loading}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? 'Canceling…' : 'Cancel subscription'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
