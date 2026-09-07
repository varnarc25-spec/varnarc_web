'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { EntityMediaField, type EntityMediaValue } from '@/components/entity-media-field';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

export type ConstructionPageSeoValue = {
  label: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  heroImageUrl?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
  heroImageWidth?: number | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
};

export function ConstructionPageSeoEditor({
  pageKey,
  initial,
}: {
  pageKey: string;
  initial: ConstructionPageSeoValue;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [h1, setH1] = useState(initial.h1);
  const [intro, setIntro] = useState(initial.intro);
  const [hero, setHero] = useState<EntityMediaValue>({
    mediaId: initial.heroImageMediaId ?? null,
    url: initial.heroImageUrl ?? null,
    alt: initial.heroImageAlt ?? '',
    displayWidth: initial.heroImageWidth ?? 380,
  });
  const [metaKeywords, setMetaKeywords] = useState(initial.metaKeywords ?? '');
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl ?? initial.path);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/construction/pages/${pageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          h1: h1 || null,
          intro: intro || null,
          heroImageUrl: hero.url || null,
          heroImageMediaId: hero.mediaId || null,
          heroImageAlt: hero.alt || null,
          heroImageWidth: hero.displayWidth ?? 380,
          metaKeywords: metaKeywords || null,
          canonicalUrl: canonicalUrl || null,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{initial.label}</h3>
        <p className="font-mono text-xs text-[var(--varnarc-subtle)]">{initial.path}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Meta title"
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
          className={inputClass}
          placeholder="Page H1"
          value={h1}
          onChange={(e) => setH1(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Meta keywords"
          value={metaKeywords}
          onChange={(e) => setMetaKeywords(e.target.value)}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Meta description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className={`${inputClass} md:col-span-2`}
          placeholder="Hero subtitle"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
        />
        <div className="md:col-span-2">
          <EntityMediaField
            label="Home page hero image"
            help="Shown on the public Construction home page. Upload from the media library."
            value={hero}
            onChange={setHero}
            showTitle
            showDisplayWidth
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" disabled={loading} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Save home page'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
