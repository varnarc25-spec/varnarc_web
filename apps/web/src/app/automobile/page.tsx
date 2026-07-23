import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { AutomobileVehicleCard, RelatedCalculators } from '@/components/automobile/vehicle-card';
import {
  AUTOMOBILE_CALCULATOR_LINKS,
  fetchAutomobileDashboard,
  fetchAutomobileManufacturers,
  fetchAutomobileVehicles,
} from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Automobile',
  description: 'Vehicle specs, comparisons, dealers, ownership calculators, and buying guides.',
  alternates: { canonical: '/automobile' },
};

export const revalidate = 60;

const productLinks = [
  { label: 'Vehicles', href: '/automobile/vehicles', description: 'Browse cars, SUVs, and two-wheelers.' },
  { label: 'Manufacturers', href: '/automobile/manufacturers', description: 'Explore brand lineups and models.' },
  { label: 'Compare vehicles', href: '/automobile/compare', description: 'Side-by-side specs and pricing.' },
  { label: 'Saved comparisons', href: '/automobile/comparisons', description: 'Curated match-ups like Swift vs Creta.' },
  { label: 'Maintenance', href: '/automobile/maintenance', description: 'Service intervals and ownership costs.' },
  { label: 'Dealers', href: '/automobile/dealers', description: 'Find showrooms and service centers.' },
  { label: 'Reviews', href: '/automobile/reviews', description: 'Expert and user vehicle reviews.' },
];

const resourceLinks = [
  { label: 'Guides', href: '/automobile/guides', description: 'Buying guides and ownership how-tos.' },
  { label: 'FAQs', href: '/automobile/faqs', description: 'Common automobile questions answered.' },
];

export default async function AutomobilePage() {
  const [dashboardRes, vehiclesRes, manufacturersRes] = await Promise.all([
    fetchAutomobileDashboard(),
    fetchAutomobileVehicles({ featured: true, limit: 6 }),
    fetchAutomobileManufacturers({ limit: 8 }),
  ]);

  const featuredVehicles = vehiclesRes.data ?? [];
  const relatedCalculators =
    dashboardRes.data?.relatedCalculators?.map((calc) => ({
      label: calc.name,
      href: `/calculators/${calc.slug}`,
    })) ?? AUTOMOBILE_CALCULATOR_LINKS;

  return (
    <ContentLayout
      title="Automobile"
      description="Ownership costs, service estimates, comparisons, and reviews."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Automobile' }]}
    >
      {dashboardRes.data ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Vehicles', value: dashboardRes.data.vehiclesPublished, href: '/automobile/vehicles' },
            {
              label: 'Manufacturers',
              value: dashboardRes.data.manufacturersPublished,
              href: '/automobile/manufacturers',
            },
            { label: 'Guides', value: dashboardRes.data.guides, href: '/automobile/guides' },
            { label: 'FAQs', value: dashboardRes.data.faqs, href: '/automobile/faqs' },
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

      {featuredVehicles.length ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">Featured vehicles</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredVehicles.map((item) => (
              <AutomobileVehicleCard
                key={item.id}
                name={item.name}
                href={`/automobile/vehicles/${item.slug}`}
                description={item.description}
                meta={[item.manufacturer?.name, item.fuelType].filter(Boolean).join(' · ') || null}
                featured={item.featured}
                sponsored={item.sponsored}
                price={item.exShowroomPrice}
              />
            ))}
          </div>
        </section>
      ) : null}

      {(manufacturersRes.data?.length ?? 0) > 0 ? (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Popular manufacturers</h2>
            <Link href="/automobile/manufacturers" className="text-sm text-[#ea580c] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {manufacturersRes.data.map((mfr) => (
              <Link
                key={mfr.id}
                href={`/automobile/manufacturers/${mfr.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0b1f3a] hover:border-[#ea580c]"
              >
                {mfr.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <RelatedCalculators links={relatedCalculators} />
    </ContentLayout>
  );
}
