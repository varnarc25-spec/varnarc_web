import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { fetchCalculators } from '@/services/content';
import { quickTools } from '@/features/home/static-data';

export const metadata: Metadata = {
  title: 'Calculators',
  description: 'Finance and planning calculators.',
  alternates: { canonical: '/calculators' },
};

export const revalidate = 60;

const popularLinks = [
  { label: 'EMI Calculator', href: '/calculators/emi' },
  { label: 'SIP Calculator', href: '/calculators/sip' },
  { label: 'Income Tax', href: '/calculators/income-tax' },
];

export default async function CalculatorsPage() {
  const { data } = await fetchCalculators(48);
  const items = data.length
    ? data.map((c) => ({
        label: c.name,
        description: c.description ?? 'Free calculator',
        href: `/calculators/${c.slug}`,
        icon: 'calculator',
      }))
    : quickTools.map((t) => ({
        label: t.name,
        description: 'Popular calculator',
        href: t.href,
        icon: 'calculator',
      }));

  const financeItems = items.filter((i) =>
    ['emi', 'sip', 'income-tax', 'gst', 'loan', 'retirement', 'fd', 'nps'].some((s) =>
      i.href.includes(s),
    ),
  );
  const homeItems = items.filter((i) =>
    ['construction', 'paint', 'concrete', 'brick', 'steel', 'tile'].some((s) => i.href.includes(s)),
  );
  const autoItems = items.filter((i) => ['car', 'fuel', 'mileage'].some((s) => i.href.includes(s)));

  return (
    <ModuleHubShell
      moduleKey="calculators"
      title="Free calculators for finance, home & auto"
      description="Finance, home, auto, and planning calculators — accurate tools for everyday decisions."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Calculators' }]}
      popularLinks={popularLinks}
      overviewTitle="Calculator overview"
    >
      {financeItems.length ? (
        <section>
          <HubSectionHeader title="Finance calculators" />
          <HubIconGrid items={financeItems} columns={4} />
        </section>
      ) : null}

      {homeItems.length ? (
        <section>
          <HubSectionHeader title="Home & construction calculators" />
          <HubIconGrid items={homeItems} columns={4} />
        </section>
      ) : null}

      {autoItems.length ? (
        <section>
          <HubSectionHeader title="Automobile calculators" />
          <HubIconGrid items={autoItems} columns={4} />
        </section>
      ) : null}

      <section>
        <HubSectionHeader title="All calculators" />
        <HubIconGrid items={items} columns={4} />
      </section>
    </ModuleHubShell>
  );
}
