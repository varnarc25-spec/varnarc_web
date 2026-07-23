import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { AutomobileVehicleCard, RelatedCalculators } from '@/components/automobile/vehicle-card';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileVehicles } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Vehicles',
  description: 'Browse cars, SUVs, two-wheelers, and commercial vehicles with specs and prices.',
  alternates: { canonical: '/automobile/vehicles' },
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{
    search?: string;
    manufacturerId?: string;
    fuelType?: string;
    featured?: string;
    category?: string;
  }>;
};

export default async function AutomobileVehiclesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { data } = await fetchAutomobileVehicles({
    limit: 48,
    search: params.search,
    manufacturerId: params.manufacturerId,
    fuelType: params.fuelType,
    category: params.category,
    featured: params.featured === 'true',
  });

  const fuelFilters = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'];

  return (
    <ContentLayout
      title="Vehicles"
      description="Compare specifications, prices, and ownership costs."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Vehicles' },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/automobile/vehicles"
          className={`rounded-full border px-3 py-1.5 text-sm ${!params.fuelType ? 'border-[#ea580c] text-[#ea580c]' : 'border-slate-200 text-[#0b1f3a]'}`}
        >
          All
        </Link>
        {fuelFilters.map((fuel) => (
          <Link
            key={fuel}
            href={`/automobile/vehicles?fuelType=${encodeURIComponent(fuel)}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${params.fuelType === fuel ? 'border-[#ea580c] text-[#ea580c]' : 'border-slate-200 text-[#0b1f3a]'}`}
          >
            {fuel}
          </Link>
        ))}
      </div>

      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((vehicle) => (
            <AutomobileVehicleCard
              key={vehicle.id}
              name={vehicle.name}
              href={`/automobile/vehicles/${vehicle.slug}`}
              description={vehicle.description}
              meta={[vehicle.manufacturer?.name, vehicle.fuelType].filter(Boolean).join(' · ') || null}
              featured={vehicle.featured}
              sponsored={vehicle.sponsored}
              price={vehicle.exShowroomPrice}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No vehicles found" message="Try another filter or check back soon." />
      )}

      <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
    </ContentLayout>
  );
}
