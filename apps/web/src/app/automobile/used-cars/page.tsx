import Link from 'next/link';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { ContentLayout } from '@/components/layout/content-layout';
import { automobileHubBreadcrumbs, buildAutomobilePageMetadata } from '@/lib/automobile/seo';
import { AUTOMOBILE_PAGE_DEFAULTS } from '@/lib/automobile/seo-pages';
import { AUTOMOBILE_CALCULATOR_LINKS } from '@/services/automobile';

export const generateMetadata = () => buildAutomobilePageMetadata('used-cars');
export const revalidate = 60;

export default function AutomobileUsedCarsPage() {
  const defaults = AUTOMOBILE_PAGE_DEFAULTS['used-cars'];

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
          { label: 'Used cars' },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/directory/used-car-dealers"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#ea580c]"
          >
            <h2 className="text-base font-extrabold text-[#0b1f3a]">Used-car dealers</h2>
            <p className="mt-2 text-sm text-slate-600">
              Directory listings tagged as used-car dealers. Confirm stock directly with the seller.
            </p>
          </Link>
          <Link
            href="/automobile/discontinued-cars"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#ea580c]"
          >
            <h2 className="text-base font-extrabold text-[#0b1f3a]">Older catalogue years</h2>
            <p className="mt-2 text-sm text-slate-600">
              Research discontinued model years from the published catalogue — not classified ads.
            </p>
          </Link>
        </div>
        <RelatedCalculators
          links={AUTOMOBILE_CALCULATOR_LINKS.filter((l) =>
            /depreciation|resale|car-loan/.test(l.href),
          )}
        />
      </ContentLayout>
    </>
  );
}
