'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Marker = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  city?: string;
  address?: string;
  sponsored?: boolean;
  featured?: boolean;
};

export function DirectoryMapView({ markers }: { markers: Marker[] }) {
  const [selected, setSelected] = useState<Marker | null>(markers[0] ?? null);

  const embedUrl = useMemo(() => {
    if (!selected) return null;
    const delta = 0.05;
    const bbox = `${selected.lng - delta},${selected.lat - delta},${selected.lng + delta},${selected.lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${selected.lat}%2C${selected.lng}`;
  }, [selected]);

  if (!markers.length) {
    return <p className="text-sm text-[var(--varnarc-subtle)]">No mappable listings found for this view.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-lg border border-[var(--varnarc-border)]">
        {embedUrl ? (
          <iframe
            title="Directory map"
            src={embedUrl}
            className="h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}
      </div>
      <ul className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
        {markers.map((marker) => (
          <li key={marker.id}>
            <button
              type="button"
              onClick={() => setSelected(marker)}
              className={`w-full rounded-lg border px-3 py-2 text-left ${selected?.id === marker.id ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]' : 'border-[var(--varnarc-border)]'}`}
            >
              <p className="font-medium">{marker.name}</p>
              <p className="text-[var(--varnarc-subtle)]">{marker.city || marker.address}</p>
              <Link href={`/directory/${marker.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                View listing
              </Link>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
