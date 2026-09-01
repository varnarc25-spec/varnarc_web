import Link from 'next/link';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { ContentLayout } from '@/components/layout/content-layout';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { automobileHubBreadcrumbs, buildAutomobilePageMetadata } from '@/lib/automobile/seo';
import { AUTOMOBILE_PAGE_DEFAULTS } from '@/lib/automobile/seo-pages';
import { AUTOMOBILE_CALCULATOR_LINKS } from '@/services/automobile';

export async function generateMetadata() {
  return buildAutomobilePageMetadata('calculators');
}

const calcItems = AUTOMOBILE_CALCULATOR_LINKS.map((c) => ({
  label: c.label,
  href: c.href,
  description: 'Ownership calculator',
  icon: 'calculator' as const,
}));

export default function AutomobileCalculatorsHubPage() {
  const defaults = AUTOMOBILE_PAGE_DEFAULTS.calculators;

  return (
    <>
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs([
          { name: 'Calculators', path: '/automobile/calculators' },
        ])}
        webPage={{
          name: defaults.h1,
          description: defaults.description,
          path: defaults.path,
        }}
        itemList={{
          name: 'Automobile calculators',
          path: defaults.path,
          items: calcItems.map((c) => ({ name: c.label, path: c.href })),
        }}
      />
      <ContentLayout
        title={defaults.h1}
        description={defaults.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Automobile', href: '/automobile' },
          { label: 'Calculators' },
        ]}
      >
        <HubIconGrid items={calcItems} columns={3} />
        <p className="mt-8 text-sm text-slate-600">
          Prefer the general calculator library?{' '}
          <Link href="/calculators" className="font-medium text-[#ea580c] hover:underline">
            Browse all calculators →
          </Link>
        </p>
      </ContentLayout>
    </>
  );
}
