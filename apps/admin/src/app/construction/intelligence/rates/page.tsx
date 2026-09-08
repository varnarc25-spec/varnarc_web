import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type RateRow = {
  id: string;
  price: string | number;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
  unit: string;
  sourceType: string;
  confidence: string;
  isDerived: boolean;
  rateStatus: string;
  verifiedAt?: string | null;
  effectiveFrom: string;
  material?: { name: string };
  specification?: { name: string } | null;
  location?: { name: string; slug: string } | null;
  sourceRecord?: { name: string } | null;
};

export default async function IntelligenceRatesPage() {
  const result = await apiServerFetch<RateRow[]>('/construction/intelligence/rates');
  const rows = result.data ?? [];

  return (
    <div>
      <PageHeader
        title="Material rates"
        description="Historical rows are preserved. Derived and fallback values must never be labelled official."
      />
      {result.error ? <p>{result.error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--varnarc-muted)] text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">Specification</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Min</th>
              <th className="px-3 py-2">Avg</th>
              <th className="px-3 py-2">Max</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Source type</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-[var(--varnarc-subtle)]" colSpan={10}>
                  No ingested material rates yet. Import a verified extract or keep using indicative
                  planning fallbacks on the public site.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--varnarc-border)]">
                  <td className="px-3 py-2">{row.material?.name}</td>
                  <td className="px-3 py-2">{row.specification?.name ?? '—'}</td>
                  <td className="px-3 py-2">{row.location?.name ?? 'National'}</td>
                  <td className="px-3 py-2">{row.minPrice ?? '—'}</td>
                  <td className="px-3 py-2">{row.price}</td>
                  <td className="px-3 py-2">{row.maxPrice ?? '—'}</td>
                  <td className="px-3 py-2">{row.unit}</td>
                  <td className="px-3 py-2">{row.sourceType}</td>
                  <td className="px-3 py-2">{row.confidence}</td>
                  <td className="px-3 py-2">{row.rateStatus}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
