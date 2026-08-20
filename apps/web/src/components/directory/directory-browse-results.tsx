'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { List, Map as MapIcon } from 'lucide-react';
import { DirectoryProviderCard } from '@/components/directory/directory-provider-card';
import type { DirectoryListing } from '@/lib/directory-hub';

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

export function DirectoryBrowseResults({
  listings,
  markers,
  title = 'Providers near you',
  emptyTitle = 'No providers to show yet',
  emptyMessage = 'Try a service and city search above, or browse popular services.',
}: {
  listings: DirectoryListing[];
  markers: Marker[];
  title?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const mapAvailable = markers.length > 0;
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(markers[0]?.id ?? null);

  const selected = useMemo(
    () => markers.find((m) => m.id === selectedId) ?? markers[0] ?? null,
    [markers, selectedId],
  );

  const embedUrl = useMemo(() => {
    if (!selected) return null;
    const delta = 0.06;
    const bbox = `${selected.lng - delta},${selected.lat - delta},${selected.lng + delta},${selected.lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${selected.lat}%2C${selected.lng}`;
  }, [selected]);

  const listingBySlug = useMemo(() => new Map(listings.map((l) => [l.slug, l])), [listings]);

  return (
    <section aria-labelledby="directory-browse-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="directory-browse-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {listings.length
              ? `${listings.length} provider${listings.length === 1 ? '' : 's'} from the directory.`
              : emptyMessage}
          </p>
        </div>

        {mapAvailable ? (
          <div
            className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
            role="group"
            aria-label="Results view"
          >
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
                view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
              aria-pressed={view === 'list'}
            >
              <List className="h-4 w-4" aria-hidden />
              List
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${
                view === 'map' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
              aria-pressed={view === 'map'}
            >
              <MapIcon className="h-4 w-4" aria-hidden />
              Map
            </button>
          </div>
        ) : null}
      </div>

      {!listings.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <h3 className="text-lg font-bold text-slate-900">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-slate-600">{emptyMessage}</p>
          <Link
            href="/directory/search"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0b1f3a] px-4 text-sm font-bold text-white"
          >
            Browse nearby providers
          </Link>
        </div>
      ) : view === 'map' && mapAvailable ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {embedUrl ? (
              <iframe
                title="Directory map of providers"
                src={embedUrl}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : null}
          </div>
          <ul className="max-h-[420px] space-y-2 overflow-y-auto">
            {markers.map((marker) => {
              const listing = listingBySlug.get(marker.slug);
              return (
                <li key={marker.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(marker.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 ${
                      selected?.id === marker.id
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{marker.name}</p>
                    <p className="mt-0.5 text-[13px] text-slate-600">
                      {marker.city || marker.address}
                    </p>
                    {listing ? (
                      <Link
                        href={`/directory/${marker.slug}`}
                        className="mt-2 inline-block text-[13px] font-semibold text-blue-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View profile
                      </Link>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className={`mt-5 grid gap-4 ${mapAvailable ? 'lg:grid-cols-[1.35fr_1fr]' : ''}`}>
          <ul className="space-y-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <DirectoryProviderCard
                  listing={listing}
                  selected={
                    mapAvailable && (selectedId === listing.id || selected?.slug === listing.slug)
                  }
                  onHighlight={
                    mapAvailable
                      ? () => {
                          const match = markers.find(
                            (m) => m.slug === listing.slug || m.id === listing.id,
                          );
                          if (match) setSelectedId(match.id);
                        }
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
          {mapAvailable ? (
            <div className="hidden lg:block">
              <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {embedUrl ? (
                  <iframe
                    title="Directory map of providers"
                    src={embedUrl}
                    className="h-[min(70vh,560px)] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <p className="p-4 text-sm text-slate-500">Map loading…</p>
                )}
                <p className="border-t border-slate-100 px-4 py-3 text-[13px] text-slate-500">
                  Map shows providers with known coordinates only.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
