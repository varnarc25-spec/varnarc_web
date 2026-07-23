'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';

export function ThemeCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          tokens: { layout: { cardRadius: '0.5rem' } },
          colors: {
            light: {
              primary: '#0b1f3a',
              accent: '#f97316',
              background: '#f7f8fb',
              surface: '#ffffff',
              textPrimary: '#0b1f3a',
              textSecondary: '#475569',
              border: '#e2e8f0',
            },
          },
          fonts: { body: 'DM Sans', heading: 'Fraunces' },
          branding: { siteName: name || 'Varnarc' },
          isDefault: false,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string }; data?: { id: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create theme');
      setMessage('Created');
      setName('');
      setSlug('');
      if (json.data?.id) {
        router.push(`/themes/${json.data.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Create theme preset</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Name</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, ''),
                );
              }
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Slug</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={create} disabled={loading || !name || !slug}>
          {loading ? 'Creating…' : 'Create preset'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
