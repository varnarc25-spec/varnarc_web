import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import { LANDING_WHY } from '@/lib/construction/landing';

export function ConstructionWhySection() {
  return (
    <ConstructionSection
      id="why-varnarc-construction"
      title="Why use Varnarc Construction"
      description="Tools designed for clear decisions — not opaque black-box quotes."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_WHY.map((item) => (
          <li key={item.title} className={cn(cx.card, 'p-4')}>
            <h3 className="text-sm font-bold text-[#0b1f3a]">{item.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{item.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
        Explore{' '}
        <Link href="/construction/guides" className={cx.link}>
          construction guides
        </Link>
        ,{' '}
        <Link href="/construction/faqs" className={cx.link}>
          FAQs
        </Link>
        , and{' '}
        <Link href="/construction/suppliers" className={cx.link}>
          suppliers
        </Link>{' '}
        when you are ready to move from planning to local execution.
      </p>
    </ConstructionSection>
  );
}
