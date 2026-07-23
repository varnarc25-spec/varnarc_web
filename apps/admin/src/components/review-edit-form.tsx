'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { MediaPicker } from '@/components/media-picker';
import { RichTextEditor } from '@/components/rich-text-editor';
import { ReviewPublishButton } from '@/components/review-forms';
import { AiSeoAssistant } from '@/components/ai-seo-assistant';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

type GalleryItem = { mediaId: string | null; url: string; caption: string };

function parseGallery(metadata: unknown): GalleryItem[] {
  const root = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  if (!Array.isArray(root.gallery)) return [];
  return root.gallery
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const item = row as Record<string, unknown>;
      const url = typeof item.url === 'string' ? item.url : '';
      if (!url) return null;
      return {
        mediaId: typeof item.mediaId === 'string' ? item.mediaId : null,
        url,
        caption: typeof item.caption === 'string' ? item.caption : '',
      };
    })
    .filter((row): row is GalleryItem => row != null);
}

export function ReviewEditForm({
  review,
}: {
  review: {
    id: string;
    title: string;
    slug: string;
    summary?: string | null;
    body?: string | null;
    verdict?: string | null;
    overallScore?: number | string | null;
    status: string;
    featuredMediaId?: string | null;
    metadata?: unknown;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(review.title);
  const [slug, setSlug] = useState(review.slug);
  const [summary, setSummary] = useState(review.summary || '');
  const [body, setBody] = useState(review.body || '');
  const [verdict, setVerdict] = useState(review.verdict || '');
  const [overallScore, setOverallScore] = useState(
    review.overallScore != null ? String(review.overallScore) : '',
  );
  const [featuredMediaId, setFeaturedMediaId] = useState<string | null>(review.featuredMediaId ?? null);
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState(review.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(review.seoDescription || '');
  const [videoUrl, setVideoUrl] = useState(() => {
    const root =
      review.metadata && typeof review.metadata === 'object'
        ? (review.metadata as Record<string, unknown>)
        : {};
    return typeof root.videoUrl === 'string' ? root.videoUrl : '';
  });
  const [gallery, setGallery] = useState<GalleryItem[]>(() => parseGallery(review.metadata));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          summary: summary || null,
          body: body || null,
          verdict: verdict || null,
          overallScore: overallScore ? Number(overallScore) : null,
          featuredMediaId,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          metadata: {
            gallery: gallery.map((item) => ({
              mediaId: item.mediaId,
              url: item.url,
              caption: item.caption || null,
            })),
            videoUrl: videoUrl || null,
          },
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  function addGalleryFromPicker(id: string | null, previewUrl?: string | null) {
    if (!id || !previewUrl) return;
    setGallery((rows) => [...rows, { mediaId: id, url: previewUrl, caption: '' }]);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
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
      </div>

      <div>
        <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Body</span>
        <RichTextEditor value={body} onChange={setBody} placeholder="Review body…" />
      </div>

      <textarea
        className={`${inputClass} min-h-24 py-2`}
        placeholder="Verdict"
        value={verdict}
        onChange={(e) => setVerdict(e.target.value)}
      />

      <AiSeoAssistant
        initialTitle={title}
        initialContent={body}
        initialExcerpt={summary}
        entityType="review"
        path={`/reviews/${slug}`}
        onApply={(seo) => {
          setSeoTitle(seo.title);
          setSeoDescription(seo.description);
        }}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO title</span>
          <input className={inputClass} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO description</span>
          <input
            className={inputClass}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </label>
      </div>

      <div className="rounded-lg border border-[var(--varnarc-border)] p-4">
        <h3 className="mb-3 text-sm font-semibold">Featured image</h3>
        <MediaPicker
          value={featuredMediaId}
          previewUrl={featuredPreview}
          onChange={(id, preview) => {
            setFeaturedMediaId(id);
            setFeaturedPreview(preview ?? null);
          }}
        />
      </div>

      <div className="rounded-lg border border-[var(--varnarc-border)] p-4 space-y-3">
        <h3 className="text-sm font-semibold">Gallery & video</h3>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">YouTube / video URL</span>
          <input className={inputClass} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </label>
        <div>
          <p className="mb-2 text-sm text-[var(--varnarc-subtle)]">Gallery images</p>
          <MediaPicker value={null} onChange={addGalleryFromPicker} />
          <ul className="mt-3 space-y-2">
            {gallery.map((item, index) => (
              <li key={`${item.url}-${index}`} className="flex flex-wrap items-center gap-2 rounded border border-[var(--varnarc-border)] p-2">
                <img src={item.url} alt="" className="h-12 w-12 rounded object-cover" />
                <input
                  className={`${inputClass} min-w-[12rem] flex-1`}
                  value={item.caption}
                  onChange={(e) =>
                    setGallery((rows) =>
                      rows.map((row, i) => (i === index ? { ...row, caption: e.target.value } : row)),
                    )
                  }
                  placeholder="Caption"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setGallery((rows) => rows.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={loading} onClick={() => void save()}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
        <ReviewPublishButton id={review.id} status={review.status} />
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
