import Link from 'next/link';
import { recommendComparableCatalogPair } from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { ComparisonCard } from '@/components/construction/comparison-card';
import { cx } from '@/components/construction/styles';

const EDITORIAL_COMPARISONS = [
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
  materials: Array<{
    id: string;
    name: string;
    category?: { name?: string; slug?: string } | null;
  }>;
}) {
  const catalogPair = recommendComparableCatalogPair(
    materials.map((m) => ({
      id: m.id,
      name: m.name,
      categoryName: m.category?.name,
      categorySlug: m.category?.slug,
    })),
  );

  const cards = [
    catalogPair
      ? {
          href: `/construction/compare?ids=${catalogPair[0].id},${catalogPair[1].id}`,
          title: `${catalogPair[0].name} vs ${catalogPair[1].name}`,
          leftLabel: catalogPair[0].name,
          rightLabel: catalogPair[1].name,
          summary: 'Like-for-like catalog options in the same material family.',
        }
      : EDITORIAL_COMPARISONS[0],
    EDITORIAL_COMPARISONS[1],
    EDITORIAL_COMPARISONS[2],
  ];

  return (
    <ConstructionSection
      id="compare-materials"
      title="Compare materials"
      description="Side-by-side options that can substitute for the same job — not unrelated products."
      action={{ href: '/construction/compare', label: 'Open compare →' }}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => (
          <ComparisonCard
            key={item.href}
            href={item.href}
            title={item.title}
            leftLabel={item.leftLabel}
            rightLabel={item.rightLabel}
            summary={item.summary}
          />
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
        Compare cement with cement, walling with walling, and finishes with finishes. Then return to{' '}
        <Link href="/construction/cement-calculator" className={cx.link}>
          quantity calculators
        </Link>{' '}
        when you are ready to size the order.
      </p>
    </ConstructionSection>
  );
}
