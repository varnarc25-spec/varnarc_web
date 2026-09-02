import Link from 'next/link';
import {
  AUTOMOBILE_DISCOVERY_CHIPS,
  AUTOMOBILE_ONROAD_CITIES,
  AUTOMOBILE_USE_CASE_PAGES,
  getAutomobileDiscoveryByPath,
  type AutomobileDiscoveryFilter,
} from '@varnarc/validation';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { AutomobileCarFinderPanel } from '@/components/automobile/car-finder-panel';
import { AutomobileResultsGrid } from '@/components/automobile/results-grid';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { automobileHubBreadcrumbs } from '@/lib/automobile/seo';
import {
  AUTOMOBILE_CALCULATOR_LINKS,
  fetchAutomobileManufacturers,
  fetchAutomobileModels,
  type AutomobileModelSummary,
} from '@/services/automobile';

export function discoveryFilterToQuery(filter: AutomobileDiscoveryFilter) {
  return {
    bodyType: filter.bodyType || filter.bodyTypeAliases?.join(','),
    fuelType: filter.fuelType || filter.fuelTypeAliases?.[0],
    transmission: filter.transmission,
    minSeats: filter.minSeats,
    maxPrice: filter.maxPrice,
    minMileage: filter.minMileageKmpl,
    minSafety: filter.minSafety,
    sort: filter.sort,
    limit: 12 as const,
  };
}

export async function AutomobileDiscoveryLanding({
  path,
  page,
  sort,
  extraQuery,
  crumbsLabel,
  query,
  h1Override,
  descriptionOverride,
}: {
  path: string;
  page: number;
  sort?: string;
  extraQuery?: string;
  crumbsLabel?: string;
  query?: Parameters<typeof fetchAutomobileModels>[0];
  h1Override?: string;
  descriptionOverride?: string;
}) {
  const landing = getAutomobileDiscoveryByPath(path);
  const [{ data: mfrs }, modelsRes] = await Promise.all([
    fetchAutomobileManufacturers({ limit: 80 }),
    fetchAutomobileModels({
      ...(landing ? discoveryFilterToQuery(landing.filter) : {}),
      ...query,
      page,
      sort: (sort as 'featured') || query?.sort || landing?.filter.sort || 'featured',
      limit: 12,
    }),
  ]);
  const models: AutomobileModelSummary[] = modelsRes.data?.items ?? [];
  const total = modelsRes.data?.total ?? 0;
  const h1 = h1Override ?? landing?.h1 ?? 'Find Cars in India';
  const description =
    descriptionOverride ??
    landing?.description ??
    'Compare cars by price, mileage, safety, features and ownership cost.';

  return (
    <>
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs([{ name: crumbsLabel ?? h1, path }])}
        webPage={{ name: h1, description, path }}
        faqs={landing?.faqs}
        itemList={
          models.length
            ? {
                name: h1,
                path,
                items: models.slice(0, 20).map((v) => ({
                  name: v.name,
                  path: `/automobile/vehicles/${v.slug}`,
                })),
              }
            : undefined
        }
      />
      <ContentLayout
        title={h1}
        description={description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Automobile', href: '/automobile' },
          { label: crumbsLabel ?? 'Cars' },
        ]}
      >
        {landing?.intro ? (
          <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-600">{landing.intro}</p>
        ) : (
          <p className="mb-6 max-w-3xl text-sm leading-6 text-slate-600">
            Compare cars by price, mileage, safety, features and ownership cost.
          </p>
        )}

        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[#0b1f3a]">What are you looking for?</h2>
          <div className="flex flex-wrap gap-2">
            {AUTOMOBILE_DISCOVERY_CHIPS.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className={`min-h-11 rounded-full border px-3 py-2 text-sm ${chip.href === path ? 'border-[#ea580c] text-[#ea580c]' : 'border-slate-200 text-[#0b1f3a]'}`}
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>

        <AutomobileCarFinderPanel manufacturers={mfrs} />

        <div className="mt-8">
          {models.length ? (
            <AutomobileResultsGrid
              models={models}
              total={total}
              page={modelsRes.data?.page ?? 1}
              pageSize={modelsRes.data?.pageSize ?? 12}
              sort={sort || landing?.filter.sort}
              basePath={path}
              search={extraQuery}
            />
          ) : (
            <EmptyState
              title="No matching published cars yet"
              message="Prices or filters may not be on file. Browse all cars or try a broader hub."
              action={
                <Link href="/automobile/vehicles" className="text-sm font-medium text-[#ea580c]">
                  Find Cars in India
                </Link>
              }
            />
          )}
        </div>

        <details className="mt-12 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-[#0b1f3a]">Explore more</summary>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold">By use case</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {AUTOMOBILE_USE_CASE_PAGES.map((p) => (
                  <li key={p.path}>
                    <Link className="text-[#ea580c] hover:underline" href={p.path}>
                      {p.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold">On-road price cities</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {AUTOMOBILE_ONROAD_CITIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      className="text-[#ea580c] hover:underline"
                      href="/automobile/calculators/on-road-price"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>

        {landing?.faqs?.length ? (
          <HubFaqSection
            title="FAQs"
            faqs={landing.faqs.map((f, i) => ({
              id: `${landing.slug}-faq-${i}`,
              question: f.question,
              answer: f.answer,
            }))}
          />
        ) : null}
        <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
      </ContentLayout>
    </>
  );
}
