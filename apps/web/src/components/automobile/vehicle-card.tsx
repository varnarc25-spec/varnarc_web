'use client';

import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';
import { Car } from 'lucide-react';
import { getApiBaseUrl } from '@/services/api-client';

export function AutomobileVehicleCard({
  name,
  href,
  description,
  meta,
  featured,
  sponsored,
  price,
}: {
  name: string;
  href: string;
  description?: string | null;
  meta?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  price?: number | string | null;
}) {
  return (
    <Link href={href} className="block transition hover:opacity-95">
      <Card className="h-full">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--varnarc-muted)] text-[#ea580c]">
              <Car className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {sponsored ? (
                <span className="rounded-full bg-[#ea580c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Sponsored
                </span>
              ) : null}
              {featured ? (
                <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
            </div>
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {description ? (
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          ) : null}
          {meta ? <p className="mt-2 text-xs font-medium text-slate-600">{meta}</p> : null}
          {price != null ? (
            <p className="mt-2 text-sm font-semibold text-[#0b1f3a]">₹{price}</p>
          ) : null}
        </CardHeader>
      </Card>
    </Link>
  );
}

export function AffiliateCta({
  url,
  label = 'Check offers',
  entityId,
  entityType = 'automobile_vehicle',
}: {
  url: string;
  label?: string;
  entityId?: string;
  entityType?: string;
}) {
  async function trackAndOpen() {
    if (entityId) {
      try {
        await fetch(`${getApiBaseUrl()}/automobile/affiliate/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            entityId,
            affiliateUrl: url,
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
            sessionId:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null,
          }),
          keepalive: true,
        });
      } catch {
        // Tracking should never block navigation.
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
      <p className="text-sm text-orange-950">Interested in this vehicle?</p>
      <button
        type="button"
        onClick={() => void trackAndOpen()}
        className="mt-3 inline-flex rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c2410c]"
      >
        {label}
      </button>
    </div>
  );
}

export function RelatedCalculators({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  if (!links.length) return null;
  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Related calculators</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0b1f3a] hover:border-[#ea580c] hover:text-[#ea580c]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AutomobileDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold text-[#0b1f3a]">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export function VehicleGallery({
  images,
  fallbackUrl,
  alt,
}: {
  images?: Array<{ id?: string; imageUrl?: string | null; altText?: string | null }>;
  fallbackUrl?: string | null;
  alt: string;
}) {
  const urls = (images ?? [])
    .map((img) => img.imageUrl)
    .filter((u): u is string => Boolean(u));
  if (!urls.length && fallbackUrl) urls.push(fallbackUrl);
  if (!urls.length) return null;
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2">
      {urls.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt={images?.[index]?.altText || alt}
          className="h-48 w-full rounded-xl border border-slate-200 bg-slate-100 object-cover"
        />
      ))}
    </div>
  );
}

export function VehicleOfferCards({
  loans,
  insurance,
}: {
  loans: Array<{
    id: string;
    name: string;
    href: string;
    interestRate?: number | string | null;
    bank?: { name?: string | null } | null;
    affiliateUrl?: string | null;
  }>;
  insurance: Array<{
    id: string;
    name: string;
    href: string;
    providerName?: string | null;
    premium?: number | string | null;
    affiliateUrl?: string | null;
  }>;
}) {
  if (!loans.length && !insurance.length) return null;
  return (
    <AutomobileDetailSection title="Finance & insurance offers">
      <div className="grid gap-3 sm:grid-cols-2">
        {loans.map((loan) => (
          <Link
            key={loan.id}
            href={loan.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#ea580c]"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">Car loan</div>
            <div className="mt-1 font-semibold text-[#0b1f3a]">{loan.name}</div>
            <p className="mt-1 text-xs text-slate-600">
              {loan.bank?.name ? `${loan.bank.name} · ` : ''}
              {loan.interestRate != null ? `From ${loan.interestRate}%` : 'View rates'}
            </p>
          </Link>
        ))}
        {insurance.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#ea580c]"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">Insurance</div>
            <div className="mt-1 font-semibold text-[#0b1f3a]">{item.name}</div>
            <p className="mt-1 text-xs text-slate-600">
              {item.providerName ? `${item.providerName} · ` : ''}
              {item.premium != null ? `From ₹${item.premium}` : 'View cover'}
            </p>
          </Link>
        ))}
      </div>
    </AutomobileDetailSection>
  );
}

export function AffiliateLeadCapture({
  entityId,
  affiliateUrl,
  entityType = 'automobile_vehicle',
}: {
  entityId: string;
  affiliateUrl?: string | null;
  entityType?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${getApiBaseUrl()}/automobile/affiliate/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          affiliateUrl,
          name: name || undefined,
          email: email || undefined,
          phone: phone || undefined,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          sessionId: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null,
        }),
        keepalive: true,
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        Thanks — we&apos;ll share offers for this vehicle shortly.
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
        >
          Get offers &amp; test-drive leads
        </button>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || (!email && !phone)}
            className="rounded-lg bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c2410c] disabled:opacity-50 sm:col-span-2"
          >
            {loading ? 'Submitting…' : 'Submit interest'}
          </button>
        </form>
      )}
    </div>
  );
}

export function VehicleReviewsBlock({
  reviews,
}: {
  reviews: Array<{
    id: string;
    title?: string | null;
    slug?: string | null;
    rating?: number | string | null;
    overallScore?: number | string | null;
    body?: string | null;
    product?: { name?: string | null } | null;
  }>;
}) {
  if (!reviews.length) return null;
  return (
    <AutomobileDetailSection title="Reviews">
      <div className="grid gap-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={review.slug ? `/reviews/${review.slug}` : '/automobile/reviews'}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#ea580c]"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-[#0b1f3a]">{review.title || 'Review'}</h3>
              {(review.rating ?? review.overallScore) != null ? (
                <span className="text-sm font-semibold text-[#ea580c]">
                  {review.rating ?? review.overallScore}/5
                </span>
              ) : null}
            </div>
            {review.body ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{review.body}</p> : null}
          </Link>
        ))}
      </div>
    </AutomobileDetailSection>
  );
}
