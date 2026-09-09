import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { brandTitleOnce } from '@/lib/seo-defaults';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: brandTitleOnce('Solar & Energy') },
  description:
    'Rooftop solar planning for Indian homes: payback, net metering, panel types, inverters, and subsidy context — not generic energy slogans.',
  alternates: { canonical: '/solar' },
};

const links = [
  {
    label: 'Solar Savings Calculator',
    href: '/calculators/solar',
    description: 'Payback & savings',
    icon: 'sun',
  },
  {
    label: 'Mono vs Poly Panels',
    href: '/compare/mono-vs-poly-solar',
    description: 'Efficiency trade-offs',
    icon: 'scale',
  },
  {
    label: 'Best Solar Panels',
    href: '/reviews/solar-panels-home',
    description: 'Rooftop picks',
    icon: 'star',
  },
  {
    label: 'Solar Inverters',
    href: '/reviews/solar-inverters',
    description: 'On-grid inverters',
    icon: 'zap',
  },
  {
    label: 'Home Inverters',
    href: '/reviews/inverters',
    description: 'Backup power',
    icon: 'fuel',
  },
  {
    label: 'Solar subsidy guide',
    href: '/articles/solar-subsidy-india',
    description: 'Incentives',
    icon: 'book',
  },
  {
    label: 'On-grid vs off-grid',
    href: '/articles/on-grid-vs-off-grid-solar',
    description: 'Net metering',
    icon: 'file',
  },
  { label: 'Solar installers', href: '/directory', description: 'Find professionals', icon: 'map' },
];

const popularLinks = [
  { label: 'Solar Calculator', href: '/calculators/solar' },
  { label: 'Panel Comparison', href: '/compare/mono-vs-poly-solar' },
  { label: 'Installers', href: '/directory' },
];

const solarFaqs = [
  {
    id: '1',
    question: 'What size rooftop system fits a typical Indian home?',
    answer:
      'Many 2–3 BHK homes land in the 3–5 kW range once you account for sanctioned load, shadow-free roof, and daytime usage. Oversizing without net-metering approval usually wastes capital.',
  },
  {
    id: '2',
    question: 'How does net metering work with my DISCOM?',
    answer:
      'You export surplus daytime units and import at night. Credits follow your state DISCOM’s rules (settlement period, banking, and whether they use net or gross metering). Confirm the application queue before you pay an installer.',
  },
  {
    id: '3',
    question: 'Are rooftop subsidies still worth checking in 2026?',
    answer:
      'Central MNRE residential support and some state top-ups still exist, but amounts and portals change. Treat any quote that “includes subsidy” as provisional until the portal shows your application status.',
  },
  {
    id: '4',
    question: 'Mono vs polycrystalline for Indian rooftops?',
    answer:
      'Mono typically delivers more watts per square metre on small roofs and hotter climates. Poly can still win on budget if roof area is ample. Compare efficiency, warranty years, and degradation — not just watt-peak price.',
  },
];

const solarGuides = [
  {
    slug: 'solar-subsidy-india',
    title: 'Solar subsidy in India',
    category: 'Solar',
    href: '/articles/solar-subsidy-india',
    readMinutes: 8,
  },
  {
    slug: 'on-grid-vs-off-grid-solar',
    title: 'On-grid vs off-grid solar',
    category: 'Solar',
    href: '/articles/on-grid-vs-off-grid-solar',
    readMinutes: 6,
  },
];

export default function SolarHubPage() {
  return (
    <ModuleHubShell
      moduleKey="solar"
      title="Solar calculators, comparisons & energy guides"
      description="Plan a rooftop plant around your DISCOM tariff, roof area, and subsidy paperwork. Start with payback, then compare panels and inverters for Indian heat and dust — not a generic “go solar” landing page."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Solar' }]}
      popularLinks={popularLinks}
      overviewTitle="Solar overview"
    >
      <section>
        <HubSectionHeader title="Solar tools & resources" viewAllHref="/calculators" />
        <HubIconGrid items={links} columns={4} />
      </section>

      <HubGuideGrid items={solarGuides} viewAllHref="/articles" />
      <HubFaqSection faqs={solarFaqs} title="Solar FAQs" />
    </ModuleHubShell>
  );
}
