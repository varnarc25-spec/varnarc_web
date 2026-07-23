import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';

export const metadata: Metadata = {
  title: 'Solar & Energy',
  description: 'Solar calculators, panel comparisons, inverters, subsidies, and energy-saving guides.',
  alternates: { canonical: '/solar' },
};

const links = [
  { label: 'Solar Savings Calculator', href: '/calculators/solar', description: 'Estimate payback and monthly savings.' },
  { label: 'Mono vs Poly Panels', href: '/compare/mono-vs-poly-solar', description: 'Efficiency and cost trade-offs.' },
  { label: 'Best Solar Panels', href: '/reviews/solar-panels-home', description: 'Editorial roundup for rooftop installs.' },
  { label: 'Solar Inverters', href: '/reviews/solar-inverters', description: 'On-grid inverter picks compared.' },
  { label: 'Home Inverters', href: '/reviews/inverters', description: 'Backup power for home and office.' },
  { label: 'Solar subsidy guide', href: '/articles/solar-subsidy-india', description: 'Central and state incentives explained.' },
  { label: 'On-grid vs off-grid', href: '/articles/on-grid-vs-off-grid-solar', description: 'Net metering and battery backup.' },
  { label: 'Solar installers', href: '/directory', description: 'Find professionals near you.' },
];

export default function SolarHubPage() {
  return (
    <ContentLayout
      title="Solar & Energy"
      description="Plan rooftop solar, compare panels and inverters, and estimate savings."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Solar' }]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <h2 className="text-sm font-extrabold text-[#0b1f3a]">{link.label}</h2>
            <p className="mt-2 text-xs text-slate-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </ContentLayout>
  );
}
