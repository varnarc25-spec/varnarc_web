import Link from 'next/link';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { AutomobileVehicleCard, RelatedCalculators } from '@/components/automobile/vehicle-card';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { automobileHubBreadcrumbs, buildAutomobilePageMetadata } from '@/lib/automobile/seo';
import {
  AUTOMOBILE_PAGE_DEFAULTS,
  type AutomobilePageKey,
} from '@/lib/automobile/seo-pages';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileVehicles } from '@/services/automobile';

export function automobileResearchMetadata(pageKey: AutomobilePageKey) {
  return buildAutomobilePageMetadata(pageKey);
}

export async function AutomobileResearchListing({
  pageKey,
}: {
  pageKey: 'specifications' | 'prices' | 'safety';
}) {
  const defaults = AUTOMOBILE_PAGE_DEFAULTS[pageKey];
  const { data } = await fetchAutomobileVehicles({ limit: 48 });
  const vehicles =
    pageKey === 'safety'
      ? data.filter((v) => v.safetyRating != null && Number(v.safetyRating) > 0)
      : data;

  return (
    <>
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs([{ name: defaults.label, path: defaults.path }])}
        webPage={{
          name: defaults.h1,
          description: defaults.description,
          path: defaults.path,
        }}
      />
      <ContentLayout
        title={defaults.h1}
        description={defaults.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Automobile', href: '/automobile' },
          { label: defaults.label },
        ]}
      >
        {vehicles.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <AutomobileVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                href={`/automobile/vehicles/${vehicle.slug}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={pageKey === 'safety' ? 'No published safety ratings yet' : 'No vehicles published yet'}
            message="We only show ratings and prices that exist on vehicle records."
            action={
              <Link href="/automobile/vehicles" className="text-sm font-medium text-[#ea580c] hover:underline">
                Browse vehicles →
              </Link>
            }
          />
        )}
        <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
      </ContentLayout>
    </>
  );
}
