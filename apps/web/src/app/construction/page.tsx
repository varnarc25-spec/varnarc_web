import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubCompareTable } from '@/components/hub/hub-compare-table';
import { HubRatesList } from '@/components/hub/hub-rates-list';
import { HubFeaturedStack } from '@/components/hub/hub-featured-stack';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import {
  fetchConstructionBrands,
  fetchConstructionCategories,
  fetchConstructionDashboard,
  fetchConstructionFaqs,
  fetchConstructionGuides,
  fetchConstructionMaterials,
} from '@/services/construction';

export const metadata: Metadata = {
  title: 'Home & Construction',
  description: 'Construction cost estimators, materials, brands, guides, and home planning tools.',
  alternates: { canonical: '/construction' },
};

export const revalidate = 60;

const productLinks = [
  {
    label: 'Materials',
    href: '/construction/materials',
    description: 'Cement, steel, tiles',
    icon: 'box',
  },
  {
    label: 'Brands',
    href: '/construction/brands',
    description: 'Trusted brands',
    icon: 'building',
  },
  {
    label: 'Cost estimator',
    href: '/construction/estimate',
    description: 'Project costs',
    icon: 'calculator',
  },
  {
    label: 'Project planner',
    href: '/construction/planner',
    description: 'Budget & timeline',
    icon: 'layers',
  },
  { label: 'Checklists', href: '/construction/checklists', description: 'By phase', icon: 'check' },
  {
    label: 'Compare materials',
    href: '/construction/compare',
    description: 'Side-by-side',
    icon: 'scale',
  },
  {
    label: 'My projects',
    href: '/construction/projects',
    description: 'Saved plans',
    icon: 'home',
  },
  {
    label: 'Suppliers',
    href: '/construction/suppliers',
    description: 'Dealers & pros',
    icon: 'users',
  },
];

const calculatorLinks = [
  { label: 'Construction Cost', href: '/calculators/construction-cost', icon: 'calculator' },
  { label: 'Paint Calculator', href: '/calculators/paint', icon: 'paint' },
  { label: 'Concrete', href: '/calculators/concrete', icon: 'box' },
  { label: 'Brick', href: '/calculators/brick', icon: 'layers' },
  { label: 'Steel', href: '/calculators/steel', icon: 'building' },
  { label: 'Tile', href: '/calculators/tile', icon: 'grid' },
];

const popularLinks = [
  { label: 'Construction Cost', href: '/calculators/construction-cost' },
  { label: 'Paint Calculator', href: '/calculators/paint' },
  { label: 'Materials', href: '/construction/materials' },
];

export default async function ConstructionPage() {
  const [dashboardRes, categoriesRes, materialsRes, brandsRes, guidesRes, faqsRes] =
    await Promise.all([
      fetchConstructionDashboard(),
      fetchConstructionCategories(),
      fetchConstructionMaterials({ featured: true, limit: 6 }),
      fetchConstructionBrands({ limit: 8 }),
      fetchConstructionGuides(),
      fetchConstructionFaqs(),
    ]);

  const relatedCalculators =
    dashboardRes.data?.relatedCalculators?.map((calc) => ({
      label: calc.name,
      description: 'Calculator',
      href: `/calculators/${calc.slug}`,
      icon: 'calculator',
    })) ?? calculatorLinks;

  const categoryItems = categoriesRes.data?.map((cat) => ({
    label: cat.name,
    href: `/construction/materials?categoryId=${cat.id}`,
    description: 'Browse materials',
    icon: 'grid',
  }));

  const featuredMaterials = materialsRes.data ?? [];
  const featuredItems = featuredMaterials.slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name,
    description:
      [item.category?.name, item.brand?.name].filter(Boolean).join(' · ') || item.description,
    href: `/construction/materials/${item.id}`,
  }));

  const compareRows = featuredMaterials.slice(0, 4).map((m) => ({
    provider: m.brand?.name ?? m.name,
    rate: m.approximatePrice != null ? `₹${m.approximatePrice}` : '—',
    fee: m.unit ?? '—',
    tenure: m.category?.name ?? '—',
    href: `/construction/materials/${m.id}`,
  }));

  const brandRates = (brandsRes.data ?? []).slice(0, 5).map((b) => ({
    label: b.name,
    value: 'View brand',
    href: `/construction/brands/${b.slug}`,
  }));

  const guides = guidesRes.data?.slice(0, 6).map((g) => ({
    slug: g.slug,
    title: g.title,
    category: 'Construction',
    summary: g.summary,
    href: `/construction/guides/${g.slug}`,
    readMinutes: 6,
  }));

  const faqs = faqsRes.data?.slice(0, 8).map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
  }));

  return (
    <ModuleHubShell
      moduleKey="construction"
      title="Home & construction tools, materials & cost estimators"
      description="Cost estimators, materials, interiors, and home improvement guides for smarter building decisions."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Home & Construction' }]}
      popularLinks={popularLinks}
      overviewTitle="Construction overview"
    >
      <section>
        <HubSectionHeader title="Popular construction calculators" viewAllHref="/calculators" />
        <HubIconGrid items={relatedCalculators} columns={4} />
      </section>

      <section>
        <HubSectionHeader title="Explore materials & tools" viewAllHref="/construction/materials" />
        <HubIconGrid items={categoryItems?.length ? categoryItems : productLinks} columns={4} />
      </section>

      <section>
        <div className="grid gap-6 lg:grid-cols-3">
          {compareRows.length ? (
            <HubCompareTable
              title="Compare materials"
              tabs={[
                { label: 'Materials', href: '/construction/materials' },
                { label: 'Brands', href: '/construction/brands' },
              ]}
              activeTab="Materials"
              rows={compareRows}
              viewAllHref="/construction/compare"
            />
          ) : null}
          {brandRates.length ? (
            <HubRatesList
              title="Popular brands"
              items={brandRates}
              viewAllHref="/construction/brands"
            />
          ) : null}
          {featuredItems.length ? (
            <HubFeaturedStack
              title="Featured materials"
              items={featuredItems}
              viewAllHref="/construction/materials"
            />
          ) : null}
        </div>
      </section>

      <section>
        <HubSectionHeader title="Browse by area" />
        <HubIconGrid items={productLinks} columns={4} />
      </section>

      {guides?.length ? <HubGuideGrid items={guides} viewAllHref="/construction/guides" /> : null}
      <HubFaqSection faqs={faqs ?? []} viewAllHref="/construction/faqs" />
    </ModuleHubShell>
  );
}
