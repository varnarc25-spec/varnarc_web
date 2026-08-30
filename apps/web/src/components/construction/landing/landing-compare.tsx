import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { ComparisonCard } from '@/components/construction/comparison-card';
import { cx } from '@/components/construction/styles';

const STATIC_COMPARISONS = [
  {
    href: '/construction/compare/aac-vs-brick',
    title: 'AAC blocks vs red bricks',
    leftLabel: 'AAC blocks',
    rightLabel: 'Red bricks',
    summary: 'Weight, insulation and finishing trade-offs for walling.',
  },
  {
    href: '/construction/compare/opc-vs-ppc',
    title: 'OPC vs PPC cement',
    leftLabel: 'OPC',
    rightLabel: 'PPC',
    summary: 'Early strength, general works and specification fit.',
  },
  {
    href: '/construction/compare/m-sand-vs-river-sand',
    title: 'M-sand vs river sand',
    leftLabel: 'M-sand',
    rightLabel: 'River sand',
    summary: 'Grading, silt and regional supply trade-offs.',
  },
] as const;

export function ConstructionLandingCompare({
  materials,
}: {
  materials: Array<{ id: string; name: string }>;
}) {
  const dynamicHref =
    materials.length >= 2
      ? `/construction/compare?ids=${materials
          .slice(0, 2)
          .map((m) => m.id)
          .join(',')}`
      : '/construction/compare';

  return (
    <ConstructionSection
      id="compare-materials"
      title="Compare materials"
      description="Evaluate options side by side before you lock quantities."
      action={{ href: '/construction/compare', label: 'Open compare →' }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ComparisonCard
          href={dynamicHref}
          title={
            materials.length >= 2
              ? `${materials[0]?.name ?? 'Material A'} vs ${materials[1]?.name ?? 'Material B'}`
              : STATIC_COMPARISONS[0].title
          }
          leftLabel={materials[0]?.name ?? STATIC_COMPARISONS[0].leftLabel}
          rightLabel={materials[1]?.name ?? STATIC_COMPARISONS[0].rightLabel}
          summary="Start a live comparison from featured catalogue materials."
        />
        {STATIC_COMPARISONS.slice(1).map((item) => (
          <ComparisonCard
            key={item.title}
            href={item.href}
            title={item.title}
            leftLabel={item.leftLabel}
            rightLabel={item.rightLabel}
            summary={item.summary}
          />
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
        Use compare for walling, steel, cement and finishes, then jump back to{' '}
        <Link href="/construction/cement-calculator" className={cx.link}>
          quantity calculators
        </Link>{' '}
        when you are ready to size the order.
      </p>
    </ConstructionSection>
  );
}
