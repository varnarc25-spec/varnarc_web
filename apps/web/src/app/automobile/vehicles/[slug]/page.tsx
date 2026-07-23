import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import {
  AffiliateCta,
  AutomobileDetailSection,
  AffiliateLeadCapture,
  RelatedCalculators,
  VehicleGallery,
  VehicleOfferCards,
  VehicleReviewsBlock,
} from '@/components/automobile/vehicle-card';
import {
  AUTOMOBILE_CALCULATOR_LINKS,
  fetchAutomobileReviews,
  fetchAutomobileVehicleBySlug,
  fetchAutomobileVehicleOffers,
} from '@/services/automobile';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchAutomobileVehicleBySlug(slug);
    return buildSeoMetadata({
      entityType: 'automobile_vehicle',
      entityId: data.id,
      path: `/automobile/vehicles/${slug}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description,
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
      : (vehicle.reviewLinks ?? [])
          .map((link) => link.review)
          .filter(Boolean);

  const title = vehicle.seoTitle || vehicle.name;
  const description = vehicle.seoDescription || vehicle.description;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Automobile', item: `${siteUrl}/automobile` },
          { '@type': 'ListItem', position: 3, name: 'Vehicles', item: `${siteUrl}/automobile/vehicles` },
          {
            '@type': 'ListItem',
            position: 4,
            name: vehicle.name,
            item: `${siteUrl}/automobile/vehicles/${slug}`,
          },
        ],
      },
      {
        '@type': 'Product',
        name: vehicle.name,
        description: description || undefined,
        brand: vehicle.manufacturer?.name
          ? { '@type': 'Brand', name: vehicle.manufacturer.name }
          : undefined,
        category: vehicle.category ?? vehicle.bodyType ?? undefined,
        ...(vehicle.exShowroomPrice != null
          ? {
              offers: {
                '@type': 'Offer',
                price: Number(vehicle.exShowroomPrice),
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
              },
            }
          : {}),
      },
    ],
  };

  const specs = [
    { label: 'Model', value: vehicle.model },
    { label: 'Variant', value: vehicle.variant },
    { label: 'Year', value: vehicle.modelYear },
    { label: 'Fuel', value: vehicle.fuelType },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Mileage', value: vehicle.mileage != null ? `${vehicle.mileage} km/l` : null },
    { label: 'Seating', value: vehicle.seatingCapacity },
    { label: 'Safety rating', value: vehicle.safetyRating },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <VehicleGallery images={vehicle.images} fallbackUrl={vehicle.imageUrl} alt={vehicle.name} />

      <div className="mb-6 flex flex-wrap gap-2">
        {vehicle.featured ? (
          <span className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
            Featured
          </span>
        ) : null}
        {vehicle.sponsored ? (
          <span className="rounded-full bg-[#ea580c] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
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

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {vehicle.exShowroomPrice != null ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Ex-showroom</div>
            <div className="mt-1 text-2xl font-extrabold text-[#0b1f3a]">₹{vehicle.exShowroomPrice}</div>
          </div>
        ) : null}
        {vehicle.estimatedOnRoadPrice != null ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Est. on-road</div>
            <div className="mt-1 text-2xl font-extrabold text-[#0b1f3a]">₹{vehicle.estimatedOnRoadPrice}</div>
          </div>
        ) : null}
      </div>

      {specs.length ? (
        <AutomobileDetailSection title="Specifications">
          <dl className="grid gap-3 sm:grid-cols-2">
            {specs.map((row) => (
              <div key={row.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">{row.label}</dt>
                <dd className="mt-0.5 font-medium text-[#0b1f3a]">{String(row.value)}</dd>
              </div>
            ))}
          </dl>
        </AutomobileDetailSection>
      ) : null}

      {vehicle.description ? (
        <AutomobileDetailSection title="Overview">{vehicle.description}</AutomobileDetailSection>
      ) : null}

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
          href={`/automobile/maintenance?vehicleId=${vehicle.id}`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0b1f3a] hover:border-[#ea580c]"
        >
          Maintenance schedule
        </Link>
      </div>

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
