import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { AutomobileVehicleCard } from '@/components/automobile/vehicle-card';
import {
  fetchAutomobileManufacturerBySlug,
  fetchAutomobileVehicles,
} from '@/services/automobile';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchAutomobileManufacturerBySlug(slug);
    return buildSeoMetadata({
      entityType: 'automobile_manufacturer',
      entityId: data.id,
      path: `/automobile/manufacturers/${slug}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description || `${data.name} vehicles and lineup.`,
      image: data.logoUrl,
    });
  } catch {
    return { title: 'Manufacturer', alternates: { canonical: `/automobile/manufacturers/${slug}` } };
  }
}

export default async function AutomobileManufacturerDetailPage({ params }: Props) {
  const { slug } = await params;
  let manufacturer: Awaited<ReturnType<typeof fetchAutomobileManufacturerBySlug>>['data'];

  try {
    const result = await fetchAutomobileManufacturerBySlug(slug);
    manufacturer = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    notFound();
  }

  const vehiclesRes = await fetchAutomobileVehicles({ manufacturerId: manufacturer.id, limit: 12 });
  const vehicles = manufacturer.vehicles?.length ? manufacturer.vehicles : vehiclesRes.data;

  return (
    <PageShell
      title={manufacturer.name}
      description={manufacturer.description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Manufacturers', href: '/automobile/manufacturers' },
        { label: manufacturer.name },
      ]}
    >
      {manufacturer.website ? (
        <p className="mb-6">
          <a
            href={manufacturer.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#ea580c] hover:underline"
          >
            Visit website →
          </a>
        </p>
      ) : null}

      {manufacturer.country ? (
        <p className="mb-4 text-sm text-slate-600">Country: {manufacturer.country}</p>
      ) : null}

      {manufacturer.description ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">About</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{manufacturer.description}</p>
        </section>
      ) : null}

      {vehicles.length ? (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Vehicles</h2>
            <Link
              href={`/automobile/vehicles?manufacturerId=${manufacturer.id}`}
              className="text-sm text-[#ea580c] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <AutomobileVehicleCard
                key={vehicle.id}
                name={vehicle.name}
                href={`/automobile/vehicles/${vehicle.slug}`}
                description={vehicle.description}
                price={vehicle.exShowroomPrice}
                featured={vehicle.featured}
                sponsored={vehicle.sponsored}
                meta={[vehicle.fuelType, vehicle.model].filter(Boolean).join(' · ') || null}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-slate-600">No published vehicles for this manufacturer yet.</p>
      )}
    </PageShell>
  );
}
