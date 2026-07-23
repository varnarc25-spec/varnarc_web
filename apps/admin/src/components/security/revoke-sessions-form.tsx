'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RevokeSessionsForm() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/security/revoke-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload?.error?.message ?? 'Failed to revoke sessions.');
        return;
      }
      setStatus('Sessions revoked successfully.');
      setUserId('');
      setReason('');
      router.refresh();
    } catch {
      setStatus('Request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-[var(--varnarc-border)] p-4">
      <h3 className="text-sm font-medium">Revoke user sessions</h3>
      <input
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
        placeholder="User UUID"
        className="h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
      />
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (optional)"
        className="h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !userId.trim()}
        className="h-10 rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Revoking…' : 'Revoke sessions'}
      </button>
      {status ? <p className="text-sm text-[var(--varnarc-subtle)]">{status}</p> : null}
    </form>
  );
}
