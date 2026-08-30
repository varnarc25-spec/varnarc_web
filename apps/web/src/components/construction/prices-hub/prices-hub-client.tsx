'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { trackPriceLocationChanged, trackPriceViewed } from '@/lib/construction/analytics';
import type { PriceObservation, PricesHubPayload } from '@/lib/construction/prices-hub/api';
import { PRICE_HUB_QUALIFICATION } from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

function money(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function FreshnessBadge({ obs }: { obs: PriceObservation }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        obs.isCurrent
          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
          : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200',
      )}
    >
      {obs.isOlderData ? 'Older data' : obs.freshnessLabel}
    </span>
  );
}

export function PricesHubClient({
  initial,
  material,
  location,
}: {
  initial: PricesHubPayload;
  material?: string;
  location?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function updateFilter(next: { material?: string; location?: string }) {
    const sp = new URLSearchParams();
    const m = next.material ?? material;
    const loc = next.location ?? location;
    if (m) sp.set('material', m);
    if (loc) sp.set('location', loc);
    if (loc) {
      trackPriceLocationChanged({
        location_level: 'city',
        path: '/construction/prices',
      });
    }
    startTransition(() => {
      router.push(`/construction/prices${sp.toString() ? `?${sp}` : ''}`);
    });
  }

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{PRICE_HUB_QUALIFICATION}</p>

      <div className={cn(cx.card, 'grid gap-3 p-4 sm:grid-cols-2 sm:p-5')}>
        <label className="text-sm">
          <span className={cx.label}>Location</span>
          <select
            className={cx.input}
            value={location ?? ''}
            disabled={pending}
            onChange={(e) => updateFilter({ location: e.target.value || undefined, material })}
          >
            <option value="">All cities</option>
            {initial.locations.map((loc) => (
              <option key={loc.slug} value={loc.slug}>
                {loc.name}
                {loc.hasData ? '' : ' (no current data)'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className={cx.label}>Material</span>
          <select
            className={cx.input}
            value={material ?? ''}
            disabled={pending}
            onChange={(e) => updateFilter({ material: e.target.value || undefined, location })}
          >
            <option value="">All materials</option>
            {initial.materials.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
                {m.hasData ? '' : ' (no current data)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span>
          Current observations: <strong className="text-[#0b1f3a]">{initial.currentCount}</strong>
        </span>
        <span>
          Older / estimated: <strong className="text-[#0b1f3a]">{initial.olderCount}</strong>
        </span>
      </div>

      {!initial.latest.length ? (
        <div className={cn(cx.card, 'p-6 text-sm text-slate-600')}>
          <p className="font-semibold text-[#0b1f3a]">No priced observations yet</p>
          <p className="mt-2">
            Reliable city×material prices appear here when LIVE or recently verified data is
            published. Until then, use educational material guides and local dealer quotes.
          </p>
          <Link href="/construction/materials" className={cn(cx.link, 'mt-3 inline-block')}>
            Browse materials hub →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {initial.latest.map((obs) => {
            const canSeo =
              obs.isCurrent &&
              obs.material?.hubKey &&
              obs.location?.slug &&
              initial.materials.some((m) => m.key === obs.material?.hubKey) &&
              initial.locations.some((l) => l.slug === obs.location?.slug);

            return (
              <li key={obs.id} className={cn(cx.card, 'p-4 sm:p-5')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#0b1f3a]">
                      {obs.material?.name ?? 'Material'}
                      {obs.location ? (
                        <span className="font-normal text-slate-500"> · {obs.location.name}</span>
                      ) : null}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <FreshnessBadge obs={obs} />
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {obs.sourceCategoryLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-xl font-extrabold tabular-nums',
                        obs.isCurrent ? 'text-[#0b1f3a]' : 'text-slate-500',
                      )}
                    >
                      {obs.isOlderData ? (
                        <span className="block text-xs font-semibold uppercase tracking-wide text-amber-800">
                          Older data — not current
                        </span>
                      ) : (
                        <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Current observation
                        </span>
                      )}
                      {money(obs.price, obs.currency)}
                      <span className="text-sm font-normal text-slate-500"> / {obs.unit}</span>
                    </p>
                    {obs.minPrice != null && obs.maxPrice != null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Range {money(obs.minPrice, obs.currency)} –{' '}
                        {money(obs.maxPrice, obs.currency)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Location</dt>
                    <dd className="font-medium text-[#0b1f3a]">
                      {obs.location?.name ?? 'National / unspecified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Last updated</dt>
                    <dd className="font-medium text-[#0b1f3a]">{formatDate(obs.lastUpdated)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Source</dt>
                    <dd className="font-medium text-[#0b1f3a]">{obs.sourceCategoryLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Freshness</dt>
                    <dd className="font-medium text-[#0b1f3a]">{obs.freshnessLabel}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {canSeo ? (
                    <Link
                      href={`/construction/prices/${obs.material!.hubKey}/${obs.location!.slug}`}
                      className={cx.primaryBtn}
                      onClick={() =>
                        trackPriceViewed({
                          material_key: obs.material?.hubKey ?? undefined,
                          location_level: 'city',
                          path: `/construction/prices/${obs.material!.hubKey}/${obs.location!.slug}`,
                        })
                      }
                    >
                      Open history
                    </Link>
                  ) : null}
                  {obs.material?.hubKey && obs.location?.slug ? (
                    <Link
                      href={`/construction/prices?material=${obs.material.hubKey}&location=${obs.location.slug}`}
                      className={cx.secondaryBtn}
                    >
                      Filter hub
                    </Link>
                  ) : null}
                  {obs.material?.hubKey ? (
                    <Link
                      href={`/construction/materials/${
                        obs.material.hubKey === 'tiles'
                          ? 'tiles'
                          : obs.material.hubKey === 'brick'
                            ? 'brick'
                            : obs.material.hubKey
                      }`}
                      className={cx.secondaryBtn}
                    >
                      Material guide
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
