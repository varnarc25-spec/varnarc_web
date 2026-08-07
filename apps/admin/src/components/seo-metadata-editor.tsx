'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

export function SeoMetadataEditForm({
  entityType,
  entityId,
  initial,
}: {
  entityType: string;
  entityId: string;
  initial: {
    title?: string | null;
    description?: string | null;
    metaKeywords?: string | null;
    canonicalUrl?: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [metaKeywords, setMetaKeywords] = useState(initial.metaKeywords ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/seo/metadata/${entityType}/${entityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          metaKeywords: metaKeywords || null,
          canonicalUrl: canonicalUrl || null,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Canonical URL"
          value={canonicalUrl}
          onChange={(e) => setCanonicalUrl(e.target.value)}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Keywords"
          value={metaKeywords}
          onChange={(e) => setMetaKeywords(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" disabled={loading} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Save metadata'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
