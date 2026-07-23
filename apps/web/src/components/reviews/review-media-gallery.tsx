export type ReviewMediaItem = {
  mediaId?: string | null;
  url?: string | null;
  caption?: string | null;
};

export type ReviewMediaMetadata = {
  gallery?: ReviewMediaItem[];
  videoUrl?: string | null;
};

export function parseReviewMedia(metadata: unknown): ReviewMediaMetadata {
  const root = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  const gallery = Array.isArray(root.gallery)
    ? root.gallery
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const item = row as Record<string, unknown>;
          const url = typeof item.url === 'string' ? item.url : null;
          const mediaId = typeof item.mediaId === 'string' ? item.mediaId : null;
          const caption = typeof item.caption === 'string' ? item.caption : null;
          if (!url && !mediaId) return null;
          return { mediaId, url, caption };
        })
        .filter((row): row is ReviewMediaItem => row != null)
    : [];
  const videoUrl = typeof root.videoUrl === 'string' && root.videoUrl ? root.videoUrl : null;
  return { gallery, videoUrl };
}

function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube-nocookie.com/embed/${parsed.pathname.replace('/', '')}`;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function ReviewMediaGallery({ metadata }: { metadata: unknown }) {
  const media = parseReviewMedia(metadata);
  const gallery = media.gallery ?? [];
  const embed = media.videoUrl ? youtubeEmbedUrl(media.videoUrl) : null;

  if (!gallery.length && !embed) return null;

  return (
    <section className="mb-8 space-y-4">
      {embed ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
          <iframe
            title="Review video"
            src={embed}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      {gallery.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, index) =>
            item.url ? (
              <figure key={`${item.url}-${index}`} className="overflow-hidden rounded-lg border border-slate-200">
                <img src={item.url} alt={item.caption || 'Review photo'} className="h-48 w-full object-cover" />
                {item.caption ? (
                  <figcaption className="px-3 py-2 text-xs text-slate-600">{item.caption}</figcaption>
                ) : null}
              </figure>
            ) : null,
          )}
        </div>
      ) : null}
    </section>
  );
}
