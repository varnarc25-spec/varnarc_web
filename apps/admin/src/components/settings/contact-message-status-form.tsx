'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';

const STATUSES = ['NEW', 'SENT', 'FAILED', 'SPAM', 'ARCHIVED'] as const;

export function ContactMessageStatusForm({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/contact/messages/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      setMessage('Status updated.');
      router.refresh();
    } catch {
      setMessage('Could not update status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 pt-2">
      <label className="block text-sm">
        Status
        <select
          className="mt-1 block h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Update status'}
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
