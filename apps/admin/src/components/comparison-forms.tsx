'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function ComparisonCloneButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cloneComparison() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comparisons/${id}/clone`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Clone failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void cloneComparison()}>
      {loading ? 'Cloning…' : 'Clone'}
    </Button>
  );
}

export function ComparisonBulkToolbar({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: 'publish' | 'delete') {
    if (!ids.length) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/comparisons/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Bulk action failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setLoading(null);
    }
  }

  if (!ids.length) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-3 text-sm">
      <span className="self-center text-[var(--varnarc-subtle)]">{ids.length} selected</span>
      <Button type="button" size="sm" disabled={loading !== null} onClick={() => void run('publish')}>
        {loading === 'publish' ? 'Publishing…' : 'Bulk publish'}
      </Button>
      <Button type="button" variant="secondary" size="sm" disabled={loading !== null} onClick={() => void run('delete')}>
        {loading === 'delete' ? 'Deleting…' : 'Bulk delete'}
      </Button>
    </div>
  );
}

export function ComparisonPublishButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'PUBLISHED') return null;

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comparisons/${id}/publish`, { method: 'POST' });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Publish failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void publish()}>
      {loading ? 'Publishing…' : 'Publish'}
    </Button>
  );
}

export function ComparisonTemplateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('vehicle');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/comparisons/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          entityType,
          description: description || undefined,
          attributes: [
            { key: 'price', label: 'Price', valueType: 'currency', sortOrder: 0 },
            { key: 'mileage', label: 'Mileage', valueType: 'text', sortOrder: 1 },
            { key: 'safety', label: 'Safety', valueType: 'rating', sortOrder: 2 },
          ],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setName('');
      setDescription('');
      setMessage('Template created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">Create comparison template</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={inputClass} value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="vehicle">Vehicle</option>
          <option value="loan_product">Loan product</option>
          <option value="construction_material">Construction material</option>
          <option value="product">Product</option>
        </select>
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <Button type="button" disabled={loading || !name} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Create template'}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}

export function ComparisonCreateForm({
  products,
  templateId,
}: {
  products: Array<{ id: string; name: string }>;
  templateId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const p1 = products[0]?.id;
  const p2 = products[1]?.id;

  async function save() {
    if (!p1 || !p2) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          description: description || undefined,
          entityType: 'vehicle',
          comparisonType: 'vehicle',
          recommendation: 'best_overall',
          templateId: templateId || undefined,
          items: [
            { productId: p1, sortOrder: 0 },
            { productId: p2, sortOrder: 1 },
          ],
          attributes: [
            { key: 'price', label: 'Ex-showroom', valueType: 'currency', values: ['₹6.5L', '₹12.5L'], sortOrder: 0 },
            { key: 'mileage', label: 'Mileage', valueType: 'text', values: ['22.4 km/l', '17.4 km/l'], sortOrder: 1 },
            { key: 'safety', label: 'Safety rating', valueType: 'rating', values: [2, 5], sortOrder: 2 },
          ],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setSlug('');
      setDescription('');
      setMessage('Comparison created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">Create comparison</h3>
      <p className="mb-3 text-xs text-[var(--varnarc-subtle)]">
        Uses first two products: {products[0]?.name ?? '—'} vs {products[1]?.name ?? '—'}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <Button type="button" disabled={loading || !title || !p1 || !p2} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Create comparison'}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
