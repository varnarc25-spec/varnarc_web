'use client';

import { useState } from 'react';

type Shot = { url?: string | null; caption?: string | null };

export function AiToolGallery({
  logoUrl,
  coverImageUrl,
  screenshots = [],
}: {
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  screenshots?: Shot[];
}) {
  const images = [
    ...(coverImageUrl ? [{ url: coverImageUrl, caption: 'Cover' }] : []),
    ...(logoUrl ? [{ url: logoUrl, caption: 'Logo' }] : []),
    ...screenshots.filter((s) => s.url),
  ];

  const [active, setActive] = useState(0);
  if (!images.length) return null;

  const current = images[active];

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Gallery</h2>
      <div className="overflow-hidden rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)]">
        <img
          src={current?.url ?? ''}
          alt={current?.caption ?? 'Tool screenshot'}
          loading="lazy"
          className="max-h-80 w-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setActive(idx)}
              className={`shrink-0 overflow-hidden rounded border ${idx === active ? 'border-[var(--varnarc-brand)]' : 'border-[var(--varnarc-border)]'}`}
            >
              <img src={img.url ?? ''} alt="" loading="lazy" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
