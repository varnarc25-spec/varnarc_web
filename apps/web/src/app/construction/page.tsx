import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionMaterialCard, RelatedCalculators } from '@/components/construction/construction-material-card';
import { RelatedArticles } from '@/components/construction/related-articles';
import {
  fetchConstructionBrands,
  fetchConstructionCategories,
  fetchConstructionDashboard,
  fetchConstructionMaterials,
} from '@/services/construction';

export const metadata: Metadata = {
  title: 'Home & Construction',
  description: 'Construction cost estimators, materials, brands, guides, and home planning tools.',
  alternates: { canonical: '/construction' },
};

export const revalidate = 60;

const productLinks = [
  { label: 'Materials', href: '/construction/materials', description: 'Cement, steel, tiles, paint, and more.' },
  { label: 'Brands', href: '/construction/brands', description: 'Compare trusted construction brands.' },
  { label: 'Cost estimator', href: '/construction/estimate', description: 'Estimate project costs by area and quality.' },
  { label: 'Project planner', href: '/construction/planner', description: 'Budget, timeline, and downloadable reports.' },
  { label: 'Checklists', href: '/construction/checklists', description: 'Material and milestone checklists by phase.' },
  { label: 'Compare materials', href: '/construction/compare', description: 'Side-by-side material comparisons.' },
  { label: 'My projects', href: '/construction/projects', description: 'Save and revisit construction plans.' },
  { label: 'Suppliers', href: '/construction/suppliers', description: 'Find dealers and professionals.' },
];

const resourceLinks = [
  { label: 'Guides', href: '/construction/guides', description: 'Buying guides and how-tos.' },
  { label: 'FAQs', href: '/construction/faqs', description: 'Common construction questions answered.' },
];

const calculatorLinks = [
  { label: 'Construction Cost', href: '/calculators/construction-cost' },
  { label: 'Paint Calculator', href: '/calculators/paint' },
  { label: 'Concrete Calculator', href: '/calculators/concrete' },
  { label: 'Brick Calculator', href: '/calculators/brick' },
  { label: 'Steel Calculator', href: '/calculators/steel' },
  { label: 'Tile Calculator', href: '/calculators/tile' },
];

export default async function ConstructionPage() {
  const [dashboardRes, categoriesRes, materialsRes, brandsRes] = await Promise.all([
    fetchConstructionDashboard(),
    fetchConstructionCategories(),
    fetchConstructionMaterials({ featured: true, limit: 6 }),
    fetchConstructionBrands({ limit: 6 }),
  ]);

  const categories = categoriesRes.data ?? [];
  const featuredMaterials = materialsRes.data ?? [];
  const relatedCalculators =
    dashboardRes.data?.relatedCalculators?.map((calc) => ({
      label: calc.name,
      href: `/calculators/${calc.slug}`,
    })) ?? calculatorLinks;

  return (
    <ContentLayout
      title="Home & Construction"
      description="Cost estimators, materials, interiors, and home improvement guides."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Home & Construction' }]}
    >
      {dashboardRes.data ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Materials', value: dashboardRes.data.materialsPublished, href: '/construction/materials' },
            { label: 'Brands', value: dashboardRes.data.brandsPublished, href: '/construction/brands' },
            { label: 'Cost templates', value: dashboardRes.data.costTemplatesPublished, href: '/construction/estimate' },
            { label: 'Categories', value: dashboardRes.data.categories, href: '/construction/materials' },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</div>
              <div className="mt-1 text-2xl font-extrabold text-[#0b1f3a]">{stat.value}</div>
            </Link>
          ))}
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Browse</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Guides &amp; resources</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {resourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <h3 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {categories.length ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">Categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/construction/materials?categoryId=${cat.id}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-[#0b1f3a] hover:border-[#f97316]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featuredMaterials.length ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">Featured materials</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredMaterials.map((item) => (
              <ConstructionMaterialCard
                key={item.id}
                name={item.name}
                href={`/construction/materials/${item.id}`}
                description={item.description}
                meta={[item.category?.name, item.brand?.name].filter(Boolean).join(' · ') || null}
                featured={item.featured}
                sponsored={item.sponsored}
                price={item.approximatePrice}
                unit={item.unit}
              />
            ))}
          </div>
        </section>
      ) : null}

      {(brandsRes.data?.length ?? 0) > 0 ? (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Popular brands</h2>
            <Link href="/construction/brands" className="text-sm text-[#f97316] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {brandsRes.data.map((brand) => (
              <Link
                key={brand.id}
                href={`/construction/brands/${brand.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0b1f3a] hover:border-[#f97316]"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <RelatedCalculators links={relatedCalculators} />
      <RelatedArticles />
    </ContentLayout>
  );
}
