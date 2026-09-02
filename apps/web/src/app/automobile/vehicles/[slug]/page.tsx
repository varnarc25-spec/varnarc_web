import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import {
  AffiliateCta,
  AutomobileDetailSection,
  AffiliateLeadCapture,
  RelatedCalculators,
  VehicleGallery,
  VehicleOfferCards,
  VehicleReviewsBlock,
  formatAutomobileInr,
} from '@/components/automobile/vehicle-card';
import {
  AUTOMOBILE_CALCULATOR_LINKS,
  fetchAutomobileReviews,
  fetchAutomobileVehicleBySlug,
  fetchAutomobileVehicleOffers,
} from '@/services/automobile';
import { automobileHubBreadcrumbs, buildAutomobileMetadata } from '@/lib/automobile/seo';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';
import { AUTOMOBILE_ONROAD_CITIES, formatAutomobileMileage } from '@varnarc/validation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchAutomobileVehicleBySlug(slug);
    return buildAutomobileMetadata({
      entityType: 'automobile_vehicle',
      entityId: data.id,
      path: `/automobile/vehicles/${slug}`,
      title: data.seoTitle || `${data.name} — Specs, Price & Ownership | Varnarc`,
      description:
        data.seoDescription ||
        data.description ||
        `Specs, indicative price and ownership tools for ${data.name}.`,
      image: data.imageUrl,
    });
  } catch {
    return { title: 'Vehicle', alternates: { canonical: `/automobile/vehicles/${slug}` } };
  }
}

export default async function AutomobileVehicleDetailPage({ params }: Props) {
  const { slug } = await params;
  let vehicle: Awaited<ReturnType<typeof fetchAutomobileVehicleBySlug>>['data'];

  try {
    const result = await fetchAutomobileVehicleBySlug(slug);
    vehicle = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    notFound();
  }

  const [{ data: offers }, { data: reviews }] = await Promise.all([
    fetchAutomobileVehicleOffers(vehicle.id),
    fetchAutomobileReviews(vehicle.id),
  ]);

  const linkedReviews =
    reviews.length > 0
      ? reviews
      : (vehicle.reviewLinks ?? []).map((link) => link.review).filter(Boolean);

  const title = vehicle.seoTitle || vehicle.name;
  const description = vehicle.seoDescription || vehicle.description;
  const path = `/automobile/vehicles/${slug}`;

  const ratingValues = linkedReviews
    .map((r) => Number(r.rating))
    .filter((n) => Number.isFinite(n) && n > 0);
  const aggregateRating =
    ratingValues.length >= 1
      ? {
          ratingValue:
            Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10,
          reviewCount: ratingValues.length,
        }
      : null;

  const specs = [
    { label: 'Model', value: vehicle.model },
    { label: 'Variant', value: vehicle.variant },
    { label: 'Year', value: vehicle.modelYear },
    { label: 'Fuel', value: vehicle.fuelType },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Mileage', value: formatAutomobileMileage(vehicle.mileage) },
    { label: 'Seating', value: vehicle.seatingCapacity },
    {
      label: 'Safety rating',
      value:
        vehicle.safetyRating != null && Number(vehicle.safetyRating) > 0
          ? `${vehicle.safetyRating}${vehicle.safetyAgency ? ` · ${vehicle.safetyAgency}` : ''}`
          : null,
    },
    { label: 'Warranty', value: vehicle.warranty },
  ].filter((row) => row.value != null && row.value !== '');

  return (
    <PageShell
      title={title}
      description={description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Vehicles', href: '/automobile/vehicles' },
        { label: vehicle.name },
      ]}
    >
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs([
          { name: 'Vehicles', path: '/automobile/vehicles' },
          { name: vehicle.name, path },
        ])}
        product={{
          name: vehicle.name,
          description: description,
          path,
          image: vehicle.imageUrl,
          brand: vehicle.manufacturer?.name,
          price: vehicle.exShowroomPrice,
          priceCurrency: 'INR',
          aggregateRating,
        }}
      />

      <VehicleGallery images={vehicle.images} fallbackUrl={vehicle.imageUrl} alt={vehicle.name} />

      <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="On this page">
        {[
          ['Overview', '#overview'],
          ['Price', '#price'],
          ['Specifications', '#specifications'],
          ['Safety', '#safety'],
          ['EMI', '/automobile/calculators/car-loan'],
          ['On-road price', `/automobile/vehicles/${slug}/on-road-price/bangalore`],
        ].map(([label, href]) => (
          <a key={label} href={href} className="min-h-11 rounded-full border px-3 py-2">
            {label}
          </a>
        ))}
      </nav>

      <div className="mb-6 flex flex-wrap gap-2">
        {vehicle.featured ? (
          <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-xs font-semibold uppercase text-white">
            Featured
          </span>
        ) : null}
        {vehicle.sponsored ? (
          <span className="rounded-full bg-[#ea580c] px-2 py-0.5 text-xs font-semibold uppercase text-white">
            Sponsored
          </span>
        ) : null}
        {vehicle.manufacturer ? (
          <Link
            href={`/automobile/manufacturers/${vehicle.manufacturer.slug}`}
            className="text-sm font-medium text-[#ea580c] hover:underline"
          >
            {vehicle.manufacturer.name}
          </Link>
        ) : null}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2" id="price">
        {vehicle.exShowroomPrice != null ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Ex-showroom</div>
            <div className="mt-1 text-2xl font-extrabold text-[#0b1f3a]">
              {formatAutomobileInr(vehicle.exShowroomPrice) ?? `₹${vehicle.exShowroomPrice}`}
            </div>
          </div>
        ) : null}
        {vehicle.estimatedOnRoadPrice != null ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Est. on-road</div>
            <div className="mt-1 text-2xl font-extrabold text-[#0b1f3a]">
              {formatAutomobileInr(vehicle.estimatedOnRoadPrice) ??
                `₹${vehicle.estimatedOnRoadPrice}`}
            </div>
          </div>
        ) : null}
      </div>

      {specs.length ? (
        <div id="specifications">
          <AutomobileDetailSection title="Specifications">
            <dl className="grid gap-3 sm:grid-cols-2">
              {specs.map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{row.label}</dt>
                  <dd className="mt-0.5 font-medium text-[#0b1f3a]">{String(row.value)}</dd>
                </div>
              ))}
            </dl>
          </AutomobileDetailSection>
        </div>
      ) : null}

      {vehicle.description ? (
        <div id="overview">
          <AutomobileDetailSection title="Overview">{vehicle.description}</AutomobileDetailSection>
        </div>
      ) : null}

      <div id="safety" className="mt-6 text-sm text-slate-600">
        {vehicle.safetyRating != null && Number(vehicle.safetyRating) > 0 ? (
          <p>
            Published safety figure: {String(vehicle.safetyRating)}
            {vehicle.safetyAgency
              ? ` (${vehicle.safetyAgency})`
              : ' — testing agency not stored, not compared across NCAP programmes'}
            .
          </p>
        ) : (
          <p>No verified crash-test rating is stored for this record.</p>
        )}
      </div>

      <VehicleReviewsBlock reviews={linkedReviews} />
      <VehicleOfferCards loans={offers.loans} insurance={offers.insurance} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/automobile/compare?ids=${vehicle.id}`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0b1f3a] hover:border-[#ea580c]"
        >
          Compare
        </Link>
        <Link
          href="/automobile/calculators/car-loan"
          className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white"
        >
          Calculate EMI
        </Link>
        <Link
          href={`/automobile/vehicles/${slug}/on-road-price/bangalore`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0b1f3a] hover:border-[#ea580c]"
        >
          Get on-road price
        </Link>
        <Link
          href={`/automobile/maintenance?vehicleId=${vehicle.id}`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0b1f3a] hover:border-[#ea580c]"
        >
          Maintenance schedule
        </Link>
      </div>

      <section className="mt-10 text-sm">
        <h2 className="font-extrabold text-[#0b1f3a]">Research next</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {vehicle.bodyType ? (
            <li>
              <Link
                className="text-[#ea580c] underline"
                href={`/automobile/${vehicle.bodyType.toLowerCase().includes('suv') ? 'suv' : vehicle.bodyType.toLowerCase().includes('hatch') ? 'hatchback' : 'sedan'}`}
              >
                Similar body type
              </Link>
            </li>
          ) : null}
          {vehicle.manufacturer ? (
            <li>
              <Link
                className="text-[#ea580c] underline"
                href={`/automobile/manufacturers/${vehicle.manufacturer.slug}`}
              >
                {vehicle.manufacturer.name} cars
              </Link>
            </li>
          ) : null}
          <li>
            <Link className="text-[#ea580c] underline" href="/automobile/calculators/fuel">
              Running cost
            </Link>
          </li>
          {AUTOMOBILE_ONROAD_CITIES.slice(0, 4).map((c) => (
            <li key={c.slug}>
              <Link
                className="text-[#ea580c] underline"
                href={`/automobile/vehicles/${slug}/on-road-price/${c.slug}`}
              >
                {c.name} price
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {vehicle.affiliateUrl ? (
        <div className="mt-8">
          <AffiliateCta url={vehicle.affiliateUrl} entityId={vehicle.id} />
        </div>
      ) : null}

      <AffiliateLeadCapture entityId={vehicle.id} affiliateUrl={vehicle.affiliateUrl} />

      <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
    </PageShell>
  );
}
