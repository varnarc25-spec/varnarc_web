import Link from 'next/link';
import { ADVANCED_CONSTRUCTION_CALCULATORS } from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { AdvancedCalcIcon } from '@/components/construction/advanced-calculators/advanced-calc-icon';

const PREVIEW = 6;

export function ConstructionAdvancedCalculatorsSection() {
  const preview = ADVANCED_CONSTRUCTION_CALCULATORS.slice(0, PREVIEW);
  const rest = ADVANCED_CONSTRUCTION_CALCULATORS.slice(PREVIEW);

  return (
    <ConstructionSection
      id="advanced-calculators"
      title="Advanced calculators"
      description="Geometry and quantity planning tools. Not a substitute for drawings or structural design."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((card) => (
          <li key={card.id}>
            <AdvancedCalcCard card={card} />
          </li>
        ))}
      </ul>
      {rest.length > 0 ? (
        <details className="mt-3">
          <summary
            className={cn(
              'cursor-pointer text-sm font-semibold text-slate-600 underline-offset-2 hover:text-[#0b1f3a] hover:underline',
              cx.focus,
            )}
          >
            Show {rest.length} more calculators
          </summary>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((card) => (
              <li key={card.id}>
                <AdvancedCalcCard card={card} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </ConstructionSection>
  );
}

function AdvancedCalcCard({ card }: { card: (typeof ADVANCED_CONSTRUCTION_CALCULATORS)[number] }) {
  return (
    <Link
      href={card.href}
      className={cn(cx.card, 'flex h-full gap-3 p-3.5 motion-reduce:transition-none', cx.focus)}
    >
      <AdvancedCalcIcon name={card.icon} />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#0b1f3a]">{card.name}</span>
        <span className="mt-1 block text-xs text-slate-600">{card.purpose}</span>
      </span>
    </Link>
  );
}
