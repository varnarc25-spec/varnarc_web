import Link from 'next/link';
import { ADVANCED_CONSTRUCTION_CALCULATORS } from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { AdvancedCalcIcon } from '@/components/construction/advanced-calculators/advanced-calc-icon';

export function ConstructionAdvancedCalculatorsSection() {
  return (
    <ConstructionSection
      id="advanced-calculators"
      title="Advanced construction calculators"
      description="Planning tools for geometry and quantities. Not a substitute for drawings or structural design."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANCED_CONSTRUCTION_CALCULATORS.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              className={cn(
                cx.card,
                'flex h-full gap-3 p-4 transition hover:border-[#f97316]/50 hover:shadow-sm',
              )}
            >
              <AdvancedCalcIcon name={card.icon} />
              <span className="min-w-0">
                <span className="block font-bold text-[#0b1f3a]">{card.name}</span>
                <span className="mt-1 block text-sm text-slate-600">{card.purpose}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ConstructionSection>
  );
}
