import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type QuoteRow = {
  id: string;
  supplierName: string;
  resourceType: string;
  resourceKey: string;
  quotedRate: string | number;
  unit: string;
  status: string;
  quotedAt: string;
  location?: { name: string } | null;
};

export default async function IntelligenceQuotationsPage() {
  const result = await apiServerFetch<QuoteRow[]>('/construction/intelligence/quotations');
  const rows = result.data ?? [];

  return (
    <div>
      <PageHeader
        title="Supplier quotations"
        description="Future-ready queue. Do not treat empty rows as missing market prices — quotes are captured when submitted."
      />
      {result.error ? <p>{result.error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--varnarc-muted)] text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-[var(--varnarc-subtle)]" colSpan={5}>
                  No supplier quotations stored yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--varnarc-border)]">
                  <td className="px-3 py-2">{row.supplierName}</td>
                  <td className="px-3 py-2">
                    {row.resourceType} / {row.resourceKey}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.quotedRate} / {row.unit}
                  </td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.location?.name ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
