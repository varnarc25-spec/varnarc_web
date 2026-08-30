import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { LANDING_CITIES } from '@/lib/construction/landing';

export function ConstructionCostByCity() {
  return (
    <ConstructionSection
      id="cost-by-city"
      title="Construction cost by city"
      description="Open the cost calculator with a city context — rates still need local verification."
      action={{ href: '/construction/cost-calculator', label: 'Open cost calculator →' }}
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_CITIES.map((city) => (
          <li key={city.slug}>
            <Link
              href={`/construction/cost-calculator?location=${encodeURIComponent(city.name.replace(' NCR', ''))}`}
              className={cn(
                'flex min-h-11 items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b1f3a]',
                'hover:border-[#f97316] hover:text-[#f97316]',
                cx.focus,
              )}
            >
              <span>{city.name}</span>
              <span className="text-xs font-medium text-slate-500">Calculate</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
        City links prefill region for planning. Actual construction cost depends on plot, finishing
        grade, labour markets and material availability — use Varnarc ranges as a starting point,
        then confirm with local quotes.
      </p>
    </ConstructionSection>
  );
}
