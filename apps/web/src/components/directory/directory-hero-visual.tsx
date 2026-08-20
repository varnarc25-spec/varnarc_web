import Link from 'next/link';
import { BadgeCheck, MapPin } from 'lucide-react';
import {
  categoryNames,
  primaryLocation,
  verificationLabel,
  type DirectoryListing,
} from '@/lib/directory-hub';

export function DirectoryHeroVisual({
  listings,
  cityHint,
}: {
  listings: DirectoryListing[];
  cityHint?: string | null;
}) {
  const previews = listings.slice(0, 3);
  const titleCity =
    cityHint?.trim() || previews.map((l) => primaryLocation(l).city).find(Boolean) || 'your area';

  return (
    <aside
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 shadow-sm shadow-slate-200/50"
      aria-label="Example of location-based provider discovery"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.25) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
              Near you
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">Providers near {titleCity}</p>
          </div>
          <div className="relative h-16 w-20 shrink-0 rounded-xl border border-emerald-100 bg-white/80">
            <svg viewBox="0 0 80 64" className="h-full w-full text-emerald-600" aria-hidden>
              <path
                d="M8 40c8-14 16-22 28-22s20 8 28 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.35"
              />
              <circle cx="24" cy="28" r="3.5" fill="currentColor" />
              <circle cx="48" cy="22" r="3.5" fill="currentColor" />
              <circle cx="62" cy="36" r="3.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        {previews.length ? (
          <ul className="mt-4 space-y-2.5">
            {previews.map((listing) => {
              const location = primaryLocation(listing);
              const categories = categoryNames(listing);
              const verified = verificationLabel(listing) === 'verified';
              return (
                <li key={listing.id}>
                  <Link
                    href={`/directory/${listing.slug}`}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{listing.name}</p>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {[location.label, categories[0]].filter(Boolean).join(' · ') ||
                          'View profile'}
                      </p>
                      {verified ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-800">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          Verified
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-4 text-[13px] leading-6 text-slate-600">
            Search by service and city to see matching providers in your area.
          </p>
        )}
      </div>
    </aside>
  );
}
