'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function PlacementCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    location: '',
    rotationMode: 'PRIORITY',
  });

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/advertisements/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Created');
      setForm({ name: '', slug: '', location: '', rotationMode: 'PRIORITY' });
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h2 className="font-semibold">Create placement</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.rotationMode}
          onChange={(e) => setForm((f) => ({ ...f, rotationMode: e.target.value }))}
        >
          {['PRIORITY', 'RANDOM', 'WEIGHTED', 'SEQUENTIAL'].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={loading}>
          Create
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
