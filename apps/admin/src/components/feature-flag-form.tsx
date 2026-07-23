'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function FeatureFlagForm({
  initial,
}: {
  initial?: { key: string; name: string; description: string | null; enabled: boolean };
}) {
  const router = useRouter();
  const [key, setKey] = useState(initial?.key ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          name,
          description: description || null,
          enabled,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string }; success?: boolean };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save flag');
      setMessage('Saved');
      if (!initial) {
        setKey('');
        setName('');
        setDescription('');
        setEnabled(false);
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">{initial ? `Edit ${initial.key}` : 'Upsert feature flag'}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Key</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={!!initial}
            placeholder="premium.ai"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Name</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Premium AI"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Description</span>
        <input
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={loading || !key || !name}>
          {loading ? 'Saving…' : 'Save flag'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
