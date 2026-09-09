import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cx } from '@/components/construction/styles';
import { PHASE2_HUB_TOOLS } from '@/lib/construction/landing';

/**
 * Crawlable planning-tool links for the Construction hub.
 * Real `<a>` tags — not JS-only chips or keyword footers.
 */
export function ConstructionHubPlanningTools() {
  return (
    <ConstructionSection
      id="planning-tools"
      title="Home construction planning tools"
      description="Move from a cost sketch to quantities, a planning BOQ, city context and professionals — without treating any figure as a live quote."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PHASE2_HUB_TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#f97316]/50 hover:ring-1 hover:ring-[#f97316]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
            >
              <span className="text-sm font-bold text-[#0b1f3a]">{tool.label}</span>
              <span className="mt-1 text-xs leading-relaxed text-slate-600">{tool.note}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Typical path:{' '}
        <Link href="/construction/cost-calculator" className={cx.link}>
          construction cost
        </Link>
        {' → '}
        <Link href="/construction/material-calculator" className={cx.link}>
          materials
        </Link>
        {' → '}
        <Link href="/construction/cement-calculator" className={cx.link}>
          cement
        </Link>
        {' → '}
        <Link href="/construction/steel-calculator" className={cx.link}>
          steel
        </Link>
        {' → '}
        <Link href="/construction/boq" className={cx.link}>
          BOQ
        </Link>
        {' → '}
        <Link href="/construction/construction-cost" className={cx.link}>
          city cost
        </Link>
        {' → '}
        <Link href="/construction/professionals" className={cx.link}>
          professionals
        </Link>
        .
      </p>
    </ConstructionSection>
  );
}
