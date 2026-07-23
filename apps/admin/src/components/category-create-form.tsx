'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

type CategoryOption = { id: string; name: string; slug: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function CategoryCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [parents, setParents] = useState<CategoryOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/categories/tree`, { cache: 'no-store' });
        const json = (await res.json()) as { data?: Array<CategoryOption & { children?: CategoryOption[] }> };
        if (cancelled) return;
        const roots = Array.isArray(json.data) ? json.data : [];
        setParents(roots.map((c) => ({ id: c.id, name: c.name, slug: c.slug })));
      } catch {
        if (!cancelled) setParents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          parentId: parentId || null,
          status: 'PUBLISHED',
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create category');
      setName('');
      setSlug('');
      setDescription('');
      setParentId('');
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
      <h3 className="text-sm font-semibold">Create category</h3>
      <div className="grid gap-3 md:grid-cols-2">
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
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Parent category (optional)</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Top-level category</option>
            {parents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={loading || !name || !slug}>
          Create
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
