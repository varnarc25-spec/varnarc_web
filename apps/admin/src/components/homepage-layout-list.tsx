'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';

export type HomepageLayoutRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isDefault: boolean;
  publishedAt: string | null;
};

export function HomepageCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          isDefault: false,
          sections: [],
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { id: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(json.error?.message || 'Failed to create layout');
        return;
      }
      if (json.data?.id) {
        router.push(`/homepage/${json.data.id}`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New layout</CardTitle>
        <CardDescription>Create a draft homepage layout to configure sections and widgets.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Name</span>
            <input
              className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Slug</span>
            <input
              className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="summer-campaign"
              required
            />
          </label>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create layout'}
        </Button>
      </form>
    </Card>
  );
}

export function HomepageLayoutActions({ layout }: { layout: HomepageLayoutRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function runAction(action: 'publish' | 'set-default' | 'delete') {
    setBusy(action);
    try {
      const path =
        action === 'publish'
          ? `/api/admin/homepage/${layout.id}/publish`
          : action === 'set-default'
            ? `/api/admin/homepage/${layout.id}/set-default`
            : `/api/admin/homepage/${layout.id}`;
      const res = await fetch(path, { method: action === 'delete' ? 'DELETE' : 'POST' });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/homepage/${layout.id}`}>
        <Button variant="secondary" size="sm">
          Edit
        </Button>
      </Link>
      {layout.status !== 'PUBLISHED' ? (
        <Button size="sm" disabled={busy === 'publish'} onClick={() => runAction('publish')}>
          Publish
        </Button>
      ) : null}
      {!layout.isDefault ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy === 'set-default'}
          onClick={() => runAction('set-default')}
        >
          Set default
        </Button>
      ) : (
        <Badge>Default</Badge>
      )}
      {!layout.isDefault ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy === 'delete'}
          onClick={() => runAction('delete')}
        >
          Delete
        </Button>
      ) : null}
    </div>
  );
}
