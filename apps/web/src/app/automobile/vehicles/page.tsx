import type { Metadata } from 'next';
import { AutomobileDiscoveryLanding } from '@/components/automobile/discovery-landing';
import { buildAutomobilePageMetadata } from '@/lib/automobile/seo';

export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  return buildAutomobilePageMetadata('vehicles', {
    searchParams: params,
    titleOverride: 'Find Cars in India — Compare Price, Mileage & Ownership | Varnarc',
    descriptionOverride:
      'Compare cars by price, mileage, safety, features and ownership cost. Indicative India catalogue — not a dealer quote.',
  });
}

function num(v: string | string[] | undefined) {
  if (typeof v !== 'string' || !v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function AutomobileVehiclesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(typeof params.page === 'string' ? params.page : 1) || 1;
  const sort = typeof params.sort === 'string' ? params.sort : undefined;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' && v) qs.set(k, v);
  }
  return (
    <AutomobileDiscoveryLanding
      path="/automobile/vehicles"
      page={page}
      sort={sort}
      extraQuery={qs.toString()}
      crumbsLabel="Cars"
      h1Override="Find Cars in India"
      descriptionOverride="Compare cars by price, mileage, safety, features and ownership cost."
      query={{
        manufacturerSlug:
          typeof params.manufacturerSlug === 'string' ? params.manufacturerSlug : undefined,
        bodyType: typeof params.bodyType === 'string' ? params.bodyType : undefined,
        fuelType: typeof params.fuelType === 'string' ? params.fuelType : undefined,
        transmission: typeof params.transmission === 'string' ? params.transmission : undefined,
        minSeats: num(params.minSeats),
        maxPrice: num(params.maxPrice),
        minMileage: num(params.minMileage),
        minSafety: num(params.minSafety),
        search: typeof params.search === 'string' ? params.search : undefined,
      }}
    />
  );
}
