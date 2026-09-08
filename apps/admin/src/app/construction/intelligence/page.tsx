import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Dashboard = Record<string, number | string | unknown[] | undefined>;

const links = [
  { href: '/construction/intelligence/rates', label: 'Material rates' },
  { href: '/construction/intelligence/sources', label: 'Sources' },
  { href: '/construction/intelligence/masters', label: 'Masters' },
  { href: '/construction/intelligence/reviews', label: 'Rate review queue' },
  { href: '/construction/intelligence/quotations', label: 'Supplier quotations' },
  { href: '/construction/intelligence/import', label: 'Import rates' },
  { href: '/construction/materials', label: 'Materials (existing)' },
];

export default async function ConstructionIntelligencePage() {
  const result = await apiServerFetch<Dashboard>('/construction/intelligence/dashboard');
  const stats = result.data ?? {};
  const cards = [
    ['Materials', stats.materials],
    ['Specifications', stats.specifications],
    ['Active rates', stats.activeRates],
    ['Labour trades', stats.labourTrades],
    ['Equipment', stats.equipment],
    ['Interior components', stats.interiors],
    ['States / UTs', stats.states],
    ['Cities', stats.cities],
    ['Sources', stats.sources],
    ['Official-source rates', stats.official],
    ['Manufacturer rates', stats.manufacturer],
    ['Verified market rates', stats.verified],
    ['Derived rates', stats.derived],
    ['Estimated fallback', stats.fallback],
    ['High confidence', stats.high],
    ['Medium confidence', stats.medium],
    ['Low confidence', stats.low],
    ['Fresh', stats.fresh],
    ['Aging', stats.aging],
    ['Stale', stats.stale],
    ['Critical', stats.critical],
    ['Older than 30d', stats.older30],
    ['Older than 90d', stats.older90],
    ['Older than 365d', stats.older365],
    ['Pending imports', stats.pendingImport],
    ['Pending reviews', stats.pendingReview],
    ['Supplier quotations', stats.quotations],
    ['Location factors', stats.locationFactors],
    ['Commercial rules', stats.commercialRules],
  ] as const;

  return (
    <div>
      <PageHeader
        title="Construction Intelligence"
        description="Rate registry, sources and masters that power public calculators. Official city prices are imported — never invented."
      />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {typeof stats.note === 'string' ? (
            <p className="mb-6 text-sm text-[var(--varnarc-subtle)]">{stats.note}</p>
          ) : null}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <div className="text-xs text-[var(--varnarc-subtle)]">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{Number(value ?? 0)}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
              >
                <div className="font-medium text-[var(--varnarc-brand)]">{item.label}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
