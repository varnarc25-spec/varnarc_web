import Link from 'next/link';
import { BadgeCheck, MapPin, Phone } from 'lucide-react';
import {
  categoryNames,
  openUntilLabel,
  primaryLocation,
  verificationDisplay,
  verificationLabel,
  type DirectoryListing,
} from '@/lib/directory-hub';

export function DirectoryProviderCard({
  listing,
  compact = false,
  selected = false,
  onHighlight,
}: {
  listing: DirectoryListing;
  compact?: boolean;
  selected?: boolean;
  /** When provided (e.g. list+map sync), highlights the card without navigating. */
  onHighlight?: () => void;
}) {
  const location = primaryLocation(listing);
  const categories = categoryNames(listing);
  const verification = verificationDisplay(verificationLabel(listing));
  const openLabel = openUntilLabel(listing.hours);
  const reviewCount = listing._count?.reviews;
  const description = listing.description?.trim();

  const shellClass = selected
    ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300'
    : 'border-slate-200 bg-white hover:border-slate-300';

  return (
    <article
      className={`rounded-2xl border p-4 transition ${shellClass}`}
      onMouseEnter={onHighlight}
      onFocusCapture={onHighlight}
    >
      <div className="flex flex-wrap gap-1.5">
        {listing.sponsored ? (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
            Sponsored
          </span>
        ) : null}
        {listing.featured ? (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
            Featured
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-950 sm:text-lg">
            <Link
              href={`/directory/${listing.slug}`}
              className="hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
              onFocus={onHighlight}
            >
              {listing.name}
            </Link>
          </h3>
          {location.label ? (
            <p className="mt-1 flex items-start gap-1.5 text-[13px] text-slate-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              <span>{location.label}</span>
            </p>
          ) : null}
          {categories.length ? (
            <p className="mt-1 text-[13px] font-medium text-slate-700">{categories.join(' · ')}</p>
          ) : null}
        </div>
        {listing.logoUrl ? (
          <img
            src={listing.logoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
        ) : null}
      </div>

      {verification ? (
        <p
          className={`mt-2 inline-flex items-center gap-1 text-[13px] font-semibold ${
            verification.tone === 'verified'
              ? 'text-emerald-800'
              : verification.tone === 'claimed'
                ? 'text-blue-800'
                : 'text-slate-600'
          }`}
        >
          {verification.tone === 'verified' ? (
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          ) : null}
          <span>{verification.text}</span>
        </p>
      ) : null}

      {typeof reviewCount === 'number' && reviewCount > 0 ? (
        <p className="mt-1 text-[13px] text-slate-600">
          <span className="sr-only">Varnarc user reviews: </span>
          {reviewCount} Varnarc user review{reviewCount === 1 ? '' : 's'}
        </p>
      ) : null}

      {openLabel ? (
        <p className="mt-1 text-[13px] font-medium text-emerald-800">{openLabel}</p>
      ) : null}

      {description && !compact ? (
        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-slate-600">{description}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/directory/${listing.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0b1f3a] px-4 text-sm font-bold text-white hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
        >
          View profile
        </Link>
        {listing.phone ? (
          <a
            href={`tel:${listing.phone}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call
          </a>
        ) : null}
        <Link
          href={`/directory/${listing.slug}#request-quote`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
        >
          Request quote
        </Link>
      </div>
    </article>
  );
}

/** Back-compat wrapper used by older directory routes. */
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
  phone,
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
  phone?: string | null;
}) {
  const listing: DirectoryListing = {
    id: slug,
    name,
    slug,
    description,
    phone,
    featured,
    sponsored,
    verificationStatus: verified ? 'VERIFIED' : 'UNVERIFIED',
    locations: city ? [{ city }] : [],
    _count: ratingCount && ratingCount > 0 ? { reviews: ratingCount } : undefined,
  };

  void rating;
  return <DirectoryProviderCard listing={listing} />;
}
