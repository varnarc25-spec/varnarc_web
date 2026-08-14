'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { MediaPicker } from '@/components/media-picker';

type Vertical = 'finance' | 'construction' | 'automobile' | 'solar' | 'general';

export function ArticleFeaturedImageField({
  value,
  previewUrl,
  title,
  excerpt,
  vertical = 'finance',
  onChange,
}: {
  value: string | null;
  previewUrl?: string | null;
  title: string;
  excerpt?: string | null;
  vertical?: Vertical;
  onChange: (id: string | null, previewUrl?: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generateWithAi() {
    if (!title.trim() || title.trim().length < 3) {
      setMessage('Add an article title first (at least 3 characters).');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/articles/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt?.trim() || null,
          vertical,
        }),
      });
      const json = (await res.json()) as {
        data?: { id?: string; url?: string; secureUrl?: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message || 'Image generation failed');
      }
      const id = json.data?.id;
      const url = json.data?.secureUrl || json.data?.url || null;
      if (!id || !url) throw new Error('AI returned no media asset');
      onChange(id, url);
      setMessage('AI image generated and set as featured image. Save the article to keep it.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-[var(--varnarc-subtle)]">Featured image</span>
        <Button type="button" onClick={generateWithAi} disabled={loading}>
          {loading ? 'Generating…' : 'Generate with AI'}
        </Button>
      </div>
      <MediaPicker value={value} previewUrl={previewUrl} onChange={onChange} />
      <p className="text-xs text-[var(--varnarc-subtle)]">
        Generates a Varnarc-style editorial illustration from the title (no text in image), uploads
        it to the media library, then sets it as the featured image.
      </p>
      {message ? <p className="text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
