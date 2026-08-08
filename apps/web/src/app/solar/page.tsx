import type { Metadata } from 'next';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
import { HubGuideGrid } from '@/components/hub/hub-guide-grid';
import { HubFaqSection } from '@/components/hub/hub-faq-section';

export const metadata: Metadata = {
  title: 'Solar & Energy',
  description:
    'Solar calculators, panel comparisons, inverters, subsidies, and energy-saving guides.',
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
    question: 'How much can I save with rooftop solar?',
    answer:
      'Savings depend on system size, tariff, and sunlight. Use our solar calculator for an estimate.',
  },
  {
    id: '2',
    question: 'What is net metering?',
    answer: 'Net metering lets you export excess power to the grid and earn credits on your bill.',
  },
  {
    id: '3',
    question: 'Are subsidies available in India?',
    answer: 'Central and state schemes exist. See our solar subsidy guide for current programs.',
  },
  {
    id: '4',
    question: 'Mono vs polycrystalline panels?',
    answer:
      'Mono panels are more efficient; poly panels are often cheaper. Compare both for your roof.',
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
      description="Plan rooftop solar, compare panels and inverters, and estimate savings with trusted tools and guides."
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
