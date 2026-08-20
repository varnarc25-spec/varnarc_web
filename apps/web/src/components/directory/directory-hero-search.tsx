'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { MapPin, Search } from 'lucide-react';
import { buildDirectorySearchHref } from '@/lib/directory-hub';

export function DirectoryHeroSearch({
  initialQuery = '',
  initialCity = '',
  popular = [],
}: {
  initialQuery?: string;
  initialCity?: string;
  popular?: Array<{ name: string; slug: string }>;
}) {
  const router = useRouter();
  const formId = useId();
  const serviceId = `${formId}-service`;
  const cityId = `${formId}-city`;
  const statusId = `${formId}-geo-status`;

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  function submit(nextQuery = query, nextCity = city) {
    router.push(
      buildDirectorySearchHref({
        q: nextQuery,
        city: nextCity,
      }),
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus('Location is not supported in this browser. Enter a city instead.');
      return;
    }
    setGeoLoading(true);
    setGeoStatus('Requesting location to suggest your city…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: 'application/json' } },
          );
          if (!res.ok) throw new Error('lookup failed');
          const json = (await res.json()) as {
            address?: { city?: string; town?: string; village?: string; state_district?: string };
          };
          const resolved =
            json.address?.city ||
            json.address?.town ||
            json.address?.village ||
            json.address?.state_district ||
            '';
          if (resolved) {
            setCity(resolved);
            setGeoStatus(`Using ${resolved}. You can edit the city field anytime.`);
          } else {
            setGeoStatus('Location found, but no city name was returned. Enter a city manually.');
          }
        } catch {
          setGeoStatus('Could not resolve your city. Enter a city manually.');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setGeoStatus('Location permission denied or unavailable. Enter a city manually.');
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        role="search"
        aria-label="Search directory providers"
        className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm shadow-slate-200/60 sm:p-4"
      >
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]">
          <div>
            <label
              htmlFor={serviceId}
              className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              What service do you need?
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id={serviceId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Architect, solar installer, electrician…"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor={cityId}
              className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500"
            >
              Where?
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600"
                aria-hidden
              />
              <input
                id={cityId}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Hyderabad"
                autoComplete="address-level2"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-12 w-full min-w-[11rem] items-center justify-center rounded-xl bg-[#0b1f3a] px-5 text-sm font-bold text-white hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 lg:w-auto"
            >
              Search providers →
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoLoading}
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:opacity-60"
          aria-describedby={statusId}
        >
          <MapPin className="h-4 w-4" aria-hidden />
          {geoLoading ? 'Detecting location…' : 'Use my current location'}
        </button>

        {popular.length ? (
          <p className="text-[13px] text-slate-600">
            <span className="font-semibold text-slate-800">Popular:</span>{' '}
            {popular.map((item, index) => (
              <span key={item.slug}>
                <button
                  type="button"
                  className="font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                  onClick={() => submit(item.name, city)}
                >
                  {item.name}
                </button>
                {index < popular.length - 1 ? <span className="mx-2 text-slate-300">·</span> : null}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      <p
        id={statusId}
        className="min-h-[1.25rem] text-[13px] text-slate-500"
        role="status"
        aria-live="polite"
      >
        {geoStatus}
      </p>
    </div>
  );
}
