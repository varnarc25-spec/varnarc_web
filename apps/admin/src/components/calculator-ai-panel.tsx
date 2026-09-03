'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

export function CalculatorAiPanel({
  name,
  slug,
  description,
  formula,
  imageUrl,
  onApplyDescription,
  onApplySeo,
  onApplyImageMetadata,
}: {
  name: string;
  slug: string;
  description: string;
  formula: string;
  imageUrl?: string | null;
  onApplyDescription: (value: string) => void;
  onApplySeo: (seo: { seoTitle: string; seoDescription: string }) => void;
  onApplyImageMetadata: (metadata: { alt: string; title: string; description: string }) => void;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/admin/ai/features/status');
        const json = (await res.json()) as { data?: { configured?: boolean } };
        if (!cancelled) setConfigured(Boolean(json.data?.configured));
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function generateDescription() {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/features/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name,
          content: `Calculator formula/config:\n${formula.slice(0, 4000)}\n\nExisting description:\n${description}`,
          excerpt: description || null,
          entityType: 'calculator',
          path: `/calculators/${slug}`,
        }),
      });
      const json = (await res.json()) as {
        data?: { description: string; title: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.data) throw new Error(json.error?.message || 'Failed');
      setDraft(json.data.description);
      onApplySeo({ seoTitle: json.data.title, seoDescription: json.data.description });
      setMessage('SEO title and description applied');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function improveDescription() {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/features/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${name}\n\n${description || 'No description yet.'}\n\nFormula:\n${formula}`,
          style: 'paragraph',
        }),
      });
      const json = (await res.json()) as {
        data?: { summary: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.data?.summary) throw new Error(json.error?.message || 'Failed');
      setDraft(json.data.summary);
      onApplyDescription(json.data.summary);
      setMessage('Description updated');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function generateImageMetadata() {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/features/image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name,
          content: `${description || 'No description yet.'}\n\nCalculator formula/config:\n${formula.slice(0, 4000)}`,
          imageUrl: imageUrl || null,
          entityType: 'calculator',
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { alt: string; title: string; description: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error?.message || 'Image metadata generation failed');
      }
      onApplyImageMetadata(json.data);
      setDraft(
        `Alt: ${json.data.alt}\nTitle: ${json.data.title}\nDescription: ${json.data.description}`,
      );
      setMessage('Image metadata applied');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Image metadata generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-[var(--varnarc-brand)]/40 bg-[var(--varnarc-muted)]/40 p-4">
      <h3 className="text-sm font-semibold">AI calculator assistant</h3>
      <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
        Generate calculator copy, SEO, and illustration metadata from the current content.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={improveDescription}
          disabled={loading || configured === false}
        >
          Write description
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={generateDescription}
          disabled={loading || configured === false}
        >
          Generate SEO
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={generateImageMetadata}
          disabled={loading || configured === false || !imageUrl}
        >
          Generate image metadata
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      {draft ? (
        <p className="mt-2 rounded-md border border-[var(--varnarc-border)] bg-white p-2 text-sm whitespace-pre-wrap">
          {draft}
        </p>
      ) : null}
    </div>
  );
}
