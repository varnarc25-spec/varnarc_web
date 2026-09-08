import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Masters = {
  trades: Array<{ id: string; name: string; slug: string }>;
  equipment: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string }>;
  phases: Array<{ id: string; code: string; name: string }>;
  workItems: Array<{ id: string; code: string; name: string }>;
  wastage: Array<{ id: string; label: string; wastagePercent: string | number }>;
  interiors: Array<{ id: string; name: string; roomType: string }>;
  benchmarks: Array<{
    id: string;
    buildingType: string;
    averageRatePerSqFt: string | number;
    sourceType: string;
    location?: { name: string } | null;
  }>;
  commercialRules?: Array<{
    kind: string;
    percent?: string | number | null;
    indexFactor?: string | number | null;
    notes?: string | null;
  }>;
  locationFactors?: Array<{
    materialTransportFactor: string | number;
    labourFactor: string | number;
    location?: { name: string } | null;
  }>;
};

export default async function IntelligenceMastersPage() {
  const result = await apiServerFetch<Masters>('/construction/intelligence/masters');
  const data = result.data;

  return (
    <div>
      <PageHeader
        title="Intelligence masters"
        description="Trades, equipment, phases, work items, wastage and benchmarks."
      />
      {result.error ? <p>{result.error}</p> : null}
      {data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {(
            [
              ['Labour trades', data.trades.map((r) => r.name)],
              ['Equipment', data.equipment.map((r) => r.name)],
              ['Professionals', data.professionals.map((r) => r.name)],
              ['Phases', data.phases.map((r) => r.name)],
              ['Work items', data.workItems.map((r) => `${r.code} — ${r.name}`)],
              ['Wastage rules', data.wastage.map((r) => `${r.label}: ${r.wastagePercent}%`)],
              ['Interiors', data.interiors.map((r) => `${r.name} (${r.roomType})`)],
              [
                'Quick ₹/sq ft benchmarks',
                data.benchmarks.map(
                  (r) =>
                    `${r.location?.name ?? 'National'} ${r.buildingType}: ₹${r.averageRatePerSqFt} (${r.sourceType})`,
                ),
              ],
              [
                'Commercial rules',
                (data.commercialRules ?? []).map(
                  (r) => `${r.kind}: ${r.percent ?? r.indexFactor ?? '—'} (${r.notes ?? ''})`,
                ),
              ],
              [
                'Location factors (default 1.0)',
                (data.locationFactors ?? []).map(
                  (r) =>
                    `${r.location?.name ?? '—'}: labour ${r.labourFactor} / transport ${r.materialTransportFactor}`,
                ),
              ],
            ] as const
          ).map(([title, items]) => (
            <section key={title} className="rounded-lg border border-[var(--varnarc-border)] p-4">
              <h2 className="mb-2 text-sm font-semibold">{title}</h2>
              <ul className="max-h-64 space-y-1 overflow-auto text-sm text-[var(--varnarc-subtle)]">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
