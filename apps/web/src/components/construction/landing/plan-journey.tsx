import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { LANDING_JOURNEY } from '@/lib/construction/landing';

export function ConstructionPlanJourney() {
  return (
    <ConstructionSection
      id="plan-your-construction"
      title="Plan your construction"
      description="A simple path from first estimate to an organised budget."
    >
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {LANDING_JOURNEY.map((step, index) => (
          <li key={step.key} className="relative">
            <Link
              href={step.href}
              className={cn(
                cx.card,
                'block h-full p-4 transition hover:ring-[#f97316]/40',
                cx.focus,
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f97316]">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-sm font-bold text-[#0b1f3a]">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{step.description}</p>
            </Link>
            {index < LANDING_JOURNEY.length - 1 ? (
              <span
                className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block"
                aria-hidden
              >
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
        Start with an{' '}
        <Link href="/construction/estimate" className={cx.link}>
          estimate
        </Link>
        , refine{' '}
        <Link href="/construction/materials" className={cx.link}>
          materials
        </Link>
        , organise a BOQ in the{' '}
        <Link href="/construction/planner" className={cx.link}>
          planner
        </Link>
        , follow{' '}
        <Link href="/construction/checklists" className={cx.link}>
          checklists
        </Link>
        , then save your{' '}
        <Link href="/construction/projects" className={cx.link}>
          project budget
        </Link>
        .
      </p>
    </ConstructionSection>
  );
}
