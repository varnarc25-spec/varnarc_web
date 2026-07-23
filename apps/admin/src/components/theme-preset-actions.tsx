'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function ThemePresetActions({
  id,
  isDefault,
}: {
  id: string;
  isDefault: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function publish() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/themes/${id}`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Publish failed');
      setMessage('Published');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this theme preset?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/themes/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Delete failed');
      setMessage('Deleted');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isDefault ? (
        <Button type="button" onClick={publish} disabled={loading}>
          Publish
        </Button>
      ) : null}
      {!isDefault ? (
        <Button type="button" onClick={remove} disabled={loading}>
          Delete
        </Button>
      ) : null}
      {message ? <span className="text-xs text-[var(--varnarc-subtle)]">{message}</span> : null}
    </div>
  );
}
