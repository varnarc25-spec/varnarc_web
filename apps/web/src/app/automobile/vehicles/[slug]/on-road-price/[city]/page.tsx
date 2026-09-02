import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AUTOMOBILE_ONROAD_CITIES,
  AUTOMOBILE_ONROAD_METHOD,
  formatAutomobilePriceRange,
} from '@varnarc/validation';
import { ContentLayout } from '@/components/layout/content-layout';
import { buildAutomobileMetadata } from '@/lib/automobile/seo';
import { fetchAutomobileVehicleBySlug } from '@/services/automobile';
import { ApiError } from '@/services/api-client';

type Props = {
  params: Promise<{ slug: string; city: string }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, city } = await params;
  const cityName = AUTOMOBILE_ONROAD_CITIES.find((c) => c.slug === city)?.name ?? city;
  return buildAutomobileMetadata({
    title: `${slug} on-road price in ${cityName} | Varnarc`,
    description: `Estimated on-road price in ${cityName}. Planning figures only — not a dealer quotation.`,
    path: `/automobile/vehicles/${slug}/on-road-price/${city}`,
  });
}

export default async function VehicleOnRoadPricePage({ params }: Props) {
  const { slug, city } = await params;
  const cityMeta = AUTOMOBILE_ONROAD_CITIES.find((c) => c.slug === city);
  if (!cityMeta) notFound();

  let vehicle: Awaited<ReturnType<typeof fetchAutomobileVehicleBySlug>>['data'];
  try {
    vehicle = (await fetchAutomobileVehicleBySlug(slug)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    notFound();
  }

  const ex = vehicle.exShowroomPrice != null ? Number(vehicle.exShowroomPrice) : null;
  const hasPrice = ex != null && Number.isFinite(ex) && ex > 0;
  const rto = hasPrice ? ex * AUTOMOBILE_ONROAD_METHOD.rtoRate : null;
  const ins = hasPrice ? ex * AUTOMOBILE_ONROAD_METHOD.insuranceRate : null;
  const other = hasPrice ? ex * AUTOMOBILE_ONROAD_METHOD.otherRate : null;
  const onroad =
    hasPrice && rto != null && ins != null && other != null ? ex + rto + ins + other : null;
  const make = vehicle.manufacturer?.slug ?? 'brand';
  const modelSlug = (vehicle.model ?? 'model').toLowerCase().replace(/\s+/g, '-');

  return (
    <ContentLayout
      title={`Estimated on-road price in ${cityMeta.name}`}
      description="Planning breakdown from published ex-showroom. Not a dealer quotation."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: vehicle.name, href: `/automobile/vehicles/${slug}` },
        { label: cityMeta.name },
      ]}
    >
      <p className="mb-4 text-sm text-slate-600">{AUTOMOBILE_ONROAD_METHOD.note}</p>
      {hasPrice ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <dt className="text-xs uppercase text-slate-500">Ex-showroom</dt>
            <dd className="font-semibold">{formatAutomobilePriceRange(ex, ex)}</dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs uppercase text-slate-500">Estimated RTO</dt>
            <dd className="font-semibold">{formatAutomobilePriceRange(rto, rto)}</dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs uppercase text-slate-500">Insurance estimate</dt>
            <dd className="font-semibold">{formatAutomobilePriceRange(ins, ins)}</dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs uppercase text-slate-500">Other charges</dt>
            <dd className="font-semibold">{formatAutomobilePriceRange(other, other)}</dd>
          </div>
          <div className="rounded-lg border p-3 sm:col-span-2">
            <dt className="text-xs uppercase text-slate-500">Estimated on-road</dt>
            <dd className="text-xl font-extrabold">{formatAutomobilePriceRange(onroad, onroad)}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm">
          No published ex-showroom on this record.{' '}
          <Link className="text-[#ea580c] underline" href="/automobile/calculators/on-road-price">
            Open the calculator
          </Link>
        </p>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Last updated: 2 Sep 2026. Source: Varnarc planning rates.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Canonical model URL also referenced as /automobile/{make}/{modelSlug}/on-road-price/{city}{' '}
        in internal links once manufacturer+model routes are unique.
      </p>
    </ContentLayout>
  );
}
