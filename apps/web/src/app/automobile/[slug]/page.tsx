import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAutomobileCategory,
  listAutomobileCategories,
  vehicleMatchesAutomobileCategory,
} from '@varnarc/validation';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { AutomobileVehicleCard, RelatedCalculators } from '@/components/automobile/vehicle-card';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { automobileHubBreadcrumbs, buildAutomobileMetadata } from '@/lib/automobile/seo';
import { AUTOMOBILE_PAGE_DEFAULTS, getAutomobileLandingDefaults } from '@/lib/automobile/seo-pages';
import {
  AUTOMOBILE_CALCULATOR_LINKS,
  fetchAutomobileVehicles,
  type AutomobileVehicle,
} from '@/services/automobile';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return listAutomobileCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const defaults = getAutomobileLandingDefaults(slug);
  if (!defaults) return { title: 'Automobile' };
  const vehicles = await loadCategoryVehicles(slug);
  return buildAutomobileMetadata({
    title: defaults.title,
    description: defaults.description,
    path: defaults.path,
    entityType: 'automobile_page',
    forceNoIndex: vehicles.length === 0,
  });
}

async function loadCategoryVehicles(slug: string): Promise<AutomobileVehicle[]> {
  const category = getAutomobileCategory(slug);
  if (!category) return [];

  const options: {
    limit: number;
    bodyType?: string;
    fuelType?: string;
    category?: string;
  } = { limit: 48 };

  if (category.filter.yearMode) {
    const all = await fetchAutomobileVehicles({ limit: 48 });
    return all.data.filter((v) => vehicleMatchesAutomobileCategory(v, category));
  }

  if (category.filter.fuelType) options.fuelType = category.filter.fuelType;
  else if (category.filter.bodyType) options.bodyType = category.filter.bodyType;
  else if (category.filter.category) options.category = category.filter.category;

  const { data } = await fetchAutomobileVehicles(options);
  const filtered = data.filter((v) => vehicleMatchesAutomobileCategory(v, category));
  // If API bodyType filter is strict and returned empty, fall back to broader fetch + client match.
  if (filtered.length === 0 && data.length === 0) {
    const all = await fetchAutomobileVehicles({ limit: 48 });
    return all.data.filter((v) => vehicleMatchesAutomobileCategory(v, category));
  }
  return filtered.length
    ? filtered
    : data.filter((v) => vehicleMatchesAutomobileCategory(v, category));
}

export default async function AutomobileCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getAutomobileCategory(slug);
  if (!category) notFound();

  const defaults = getAutomobileLandingDefaults(slug) ?? AUTOMOBILE_PAGE_DEFAULTS.vehicles;
  const vehicles = await loadCategoryVehicles(slug);
  const thin = vehicles.length === 0;

  const siblings = listAutomobileCategories().filter((c) => c.slug !== slug);

  return (
    <>
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs([{ name: category.name, path: category.path }])}
        webPage={{
          name: defaults.h1,
          description: defaults.description,
          path: category.path,
        }}
        faqs={category.faqs}
        itemList={
          vehicles.length
            ? {
                name: category.name,
                path: category.path,
                items: vehicles.slice(0, 20).map((v) => ({
                  name: v.name,
                  path: `/automobile/vehicles/${v.slug}`,
                })),
              }
            : undefined
        }
      />
      <ContentLayout
        title={defaults.h1}
        description={defaults.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Automobile', href: '/automobile' },
          { label: category.name },
        ]}
      >
        {thin ? (
          <EmptyState
            title={`No published ${category.name.toLowerCase()} yet`}
            message="Check back soon, or browse all vehicles and ownership calculators."
            action={
              <Link
                href="/automobile/vehicles"
                className="text-sm font-medium text-[#ea580c] hover:underline"
              >
                Browse vehicles →
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <AutomobileVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                href={`/automobile/vehicles/${vehicle.slug}`}
              />
            ))}
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">Browse by category</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {siblings.map((c) => (
              <Link
                key={c.slug}
                href={c.path}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-[#0b1f3a] hover:border-[#ea580c]"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/automobile/vehicles"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-[#0b1f3a] hover:border-[#ea580c]"
            >
              All vehicles
            </Link>
          </div>
        </section>

        <HubFaqSection
          title={`${category.name} FAQs`}
          faqs={category.faqs.map((f, i) => ({
            id: `${slug}-faq-${i}`,
            question: f.question,
            answer: f.answer,
          }))}
        />

        <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
      </ContentLayout>
    </>
  );
}
