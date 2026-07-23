'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function MenuCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('header');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, location }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create menu');
      setName('');
      setSlug('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Create menu</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            );
          }}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="header">header</option>
          <option value="footer">footer</option>
          <option value="sidebar">sidebar</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={loading || !name || !slug}>
          Create menu
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
