import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubCompareTable } from '@/components/hub/hub-compare-table';
import { HubRatesList } from '@/components/hub/hub-rates-list';
import { HubFeaturedStack } from '@/components/hub/hub-featured-stack';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { listAutomobileCategories } from '@varnarc/validation';
import { automobileHubBreadcrumbs, buildAutomobilePageMetadata } from '@/lib/automobile/seo';
import { AUTOMOBILE_PAGE_DEFAULTS } from '@/lib/automobile/seo-pages';
import {
  AUTOMOBILE_CALCULATOR_LINKS,
  fetchAutomobileDashboard,
  fetchAutomobileFaqs,
  fetchAutomobileGuides,
  fetchAutomobileManufacturers,
  fetchAutomobileVehicles,
} from '@/services/automobile';

export async function generateMetadata() {
  return buildAutomobilePageMetadata('hub');
}

export const revalidate = 60;

const productLinks = [
  {
    label: 'Vehicles',
    href: '/automobile/vehicles',
    description: 'Cars, SUVs & bikes',
    icon: 'car',
  },
  {
    label: 'Manufacturers',
    href: '/automobile/manufacturers',
    description: 'Brand lineups',
    icon: 'building',
  },
  {
    label: 'Compare vehicles',
    href: '/automobile/compare',
    description: 'Specs & pricing',
    icon: 'scale',
  },
  {
    label: 'Comparisons',
    href: '/automobile/comparisons',
    description: 'Curated match-ups',
    icon: 'grid',
  },
  {
    label: 'Maintenance',
    href: '/automobile/maintenance',
    description: 'Service costs',
    icon: 'fuel',
  },
  { label: 'Dealers', href: '/automobile/dealers', description: 'Showrooms', icon: 'map' },
  { label: 'Reviews', href: '/automobile/reviews', description: 'Expert reviews', icon: 'star' },
  {
    label: 'Calculators',
    href: '/automobile/calculators',
    description: 'EMI, fuel & more',
    icon: 'calculator',
  },
];

const categoryLinks = listAutomobileCategories().map((c) => ({
  label: c.name,
  href: c.path,
  description: 'Category hub',
  icon: 'car' as const,
}));

const popularLinks = [
  { label: 'Car Loan EMI', href: '/automobile/calculators/car-loan' },
  { label: 'Compare Cars', href: '/automobile/compare' },
  { label: 'SUVs', href: '/automobile/suv' },
  { label: 'EVs', href: '/automobile/ev' },
];

export default async function AutomobilePage() {
  const defaults = AUTOMOBILE_PAGE_DEFAULTS.hub;
  const [dashboardRes, vehiclesRes, manufacturersRes, guidesRes, faqsRes] = await Promise.all([
    fetchAutomobileDashboard(),
    fetchAutomobileVehicles({ featured: true, limit: 6 }),
    fetchAutomobileManufacturers({ limit: 8 }),
    fetchAutomobileGuides(),
    fetchAutomobileFaqs(),
  ]);

  const relatedCalculators =
    dashboardRes.data?.relatedCalculators?.map((calc) => ({
      label: calc.name,
      description: 'Calculator',
      href: `/automobile/calculators/${calc.slug}`,
      icon: 'calculator' as const,
    })) ??
    AUTOMOBILE_CALCULATOR_LINKS.map((c) => ({
      label: c.label,
      href: c.href,
      description: 'Calculator',
      icon: 'calculator' as const,
    }));

  const featuredVehicles = vehiclesRes.data ?? [];
  const featuredItems = featuredVehicles.slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name,
    description: [item.manufacturer?.name, item.fuelType].filter(Boolean).join(' · ') || undefined,
    href: `/automobile/vehicles/${item.slug}`,
  }));

  const compareRows = featuredVehicles.slice(0, 4).map((v) => ({
    provider: v.manufacturer?.name ?? v.name,
    rate: v.exShowroomPrice != null ? `₹${v.exShowroomPrice}` : '—',
    fee: v.fuelType ?? '—',
    tenure: v.bodyType ?? '—',
    href: `/automobile/vehicles/${v.slug}`,
  }));

  const mfrList = (manufacturersRes.data ?? []).slice(0, 5).map((m) => ({
    label: m.name,
    value: 'View lineup',
    href: `/automobile/manufacturers/${m.slug}`,
  }));

  const guides = guidesRes.data?.slice(0, 6).map((g) => ({
    slug: g.slug,
    title: g.title,
    category: 'Automobile',
    summary: g.summary,
    href: `/automobile/guides/${g.slug}`,
    readMinutes: 5,
  }));

  const faqs = faqsRes.data?.slice(0, 8).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  return (
    <>
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs()}
        webPage={{
          name: defaults.h1,
          description: defaults.description,
          path: defaults.path,
        }}
        faqs={
          faqs?.length ? faqs.map((f) => ({ question: f.question, answer: f.answer })) : undefined
        }
        itemList={{
          name: 'Browse by category',
          path: '/automobile',
          items: categoryLinks.map((c) => ({ name: c.label, path: c.href })),
        }}
      />
      <ModuleHubShell
        moduleKey="automobile"
        title={defaults.h1}
        description={defaults.description}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Automobile' }]}
        popularLinks={popularLinks}
        overviewTitle="Automobile overview"
      >
        <section>
          <HubSectionHeader
            title="Popular automobile calculators"
            viewAllHref="/automobile/calculators"
          />
          <HubIconGrid items={relatedCalculators} columns={4} />
        </section>

        <section>
          <HubSectionHeader title="Browse by body type & fuel" viewAllHref="/automobile/vehicles" />
          <HubIconGrid items={categoryLinks} columns={3} />
        </section>

        <section>
          <HubSectionHeader
            title="Explore vehicles & services"
            viewAllHref="/automobile/vehicles"
          />
          <HubIconGrid items={productLinks} columns={4} />
        </section>

        <section>
          <div className="grid gap-6 lg:grid-cols-3">
            {compareRows.length ? (
              <HubCompareTable
                title="Compare vehicles"
                tabs={[
                  { label: 'SUVs', href: '/automobile/suv' },
                  { label: 'Hatchbacks', href: '/automobile/hatchback' },
                  { label: 'EVs', href: '/automobile/ev' },
                ]}
                activeTab="SUVs"
                rows={compareRows}
                viewAllHref="/automobile/compare"
              />
            ) : null}
            {mfrList.length ? (
              <HubRatesList
                title="Popular manufacturers"
                items={mfrList}
                viewAllHref="/automobile/manufacturers"
              />
            ) : null}
            {featuredItems.length ? (
              <HubFeaturedStack
                title="Featured vehicles"
                items={featuredItems}
                viewAllHref="/automobile/vehicles"
              />
            ) : null}
          </div>
        </section>

        {guides?.length ? <HubGuideGrid items={guides} viewAllHref="/automobile/guides" /> : null}
        <HubFaqSection faqs={faqs ?? []} viewAllHref="/automobile/faqs" />
      </ModuleHubShell>
    </>
  );
}
