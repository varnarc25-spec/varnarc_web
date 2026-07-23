'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';

export function DirectoryListingCard({
  name,
  slug,
  description,
  city,
  featured,
  sponsored,
  verified,
  rating,
  ratingCount,
}: {
  name: string;
  slug: string;
  description?: string | null;
  city?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  verified?: boolean;
  rating?: number | null;
  ratingCount?: number;
}) {
  return (
    <Link href={`/directory/${slug}`} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-1 flex flex-wrap gap-1.5 text-xs">
            {verified ? <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">Verified</span> : null}
            {featured ? <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">Featured</span> : null}
            {sponsored ? <span className="rounded bg-[var(--varnarc-muted)] px-1.5 py-0.5">Sponsored</span> : null}
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {city ? <p className="text-xs text-[var(--varnarc-subtle)]">{city}</p> : null}
          {rating != null && ratingCount ? (
            <p className="text-xs text-amber-600">
              {Number(rating).toFixed(1)} / 5 · {ratingCount} reviews
            </p>
          ) : null}
          {description ? (
            <CardDescription className="line-clamp-3">{description}</CardDescription>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}
