'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function MenuManager({
  menuId,
  name,
  location,
  items,
}: {
  menuId: string;
  name: string;
  location: string;
  items: Array<{ id: string; label: string; href: string | null; sortOrder: number }>;
}) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function addItem() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/menus/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuId,
          label,
          href: href || null,
          sortOrder: items.length,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to add item');
      setLabel('');
      setHref('');
      setMessage('Added');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(itemId: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/menus/items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId, itemId }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to remove');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-[var(--varnarc-subtle)]">Location: {location}</p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-[var(--varnarc-subtle)]">{item.href || '—'}</div>
            </div>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => removeItem(item.id)}
              disabled={loading}
            >
              Remove
            </button>
          </li>
        ))}
        {!items.length ? (
          <li className="text-sm text-[var(--varnarc-subtle)]">No items yet.</li>
        ) : null}
      </ul>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="URL /path"
          value={href}
          onChange={(e) => setHref(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={addItem} disabled={loading || !label}>
          Add item
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
