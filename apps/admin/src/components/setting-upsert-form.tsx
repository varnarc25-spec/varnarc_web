'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function SettingUpsertForm() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [group, setGroup] = useState('general');
  const [value, setValue] = useState('{}');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new Error('Value must be valid JSON');
      }

      const res = await fetch('/api/admin/settings/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, group, value: parsed }),
      });
      const json = (await res.json()) as { error?: { message?: string }; success?: boolean };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save setting');
      setMessage('Saved');
      setKey('');
      setValue('{}');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Upsert setting</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Key</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="site.name"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Group</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="general"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Value (JSON)</span>
        <textarea
          className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={loading || !key}>
          {loading ? 'Saving…' : 'Save setting'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
