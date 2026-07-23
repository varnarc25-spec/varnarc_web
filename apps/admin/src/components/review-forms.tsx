'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function ReviewPublishButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'PUBLISHED') return null;

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}/publish`, { method: 'POST' });
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

export function ReviewCreateForm({ products }: { products: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [overallScore, setOverallScore] = useState('4.0');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          title,
          slug: slug || slugify(title),
          summary: summary || undefined,
          body: body || undefined,
          overallScore: overallScore ? Number(overallScore) : undefined,
          reviewType: 'editorial',
          entityType: 'vehicle',
          pros: [],
          cons: [],
          sections: [],
          scores: [],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setTitle('');
      setSlug('');
      setSummary('');
      setBody('');
      setMessage('Created');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold">Create editorial review</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Overall score"
          value={overallScore}
          onChange={(e) => setOverallScore(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <textarea
          className={`${inputClass} min-h-24 py-2 md:col-span-2`}
          placeholder="Body (markdown)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <Button type="button" disabled={loading || !title || !productId} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Create review'}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}

export function ModerationActionButtons({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function moderate(status: 'APPROVED' | 'REJECTED') {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/moderation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" disabled={loading} onClick={() => void moderate('APPROVED')}>
        Approve
      </Button>
      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => void moderate('REJECTED')}>
        Reject
      </Button>
    </div>
  );
}
