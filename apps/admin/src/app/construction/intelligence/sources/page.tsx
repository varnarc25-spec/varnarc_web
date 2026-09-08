import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Source = {
  id: string;
  name: string;
  organization?: string | null;
  sourceType: string;
  sourceUrl?: string | null;
  geographicalCoverage?: string | null;
  notes?: string | null;
  lastCheckedAt?: string | null;
};

export default async function IntelligenceSourcesPage() {
  const result = await apiServerFetch<Source[]>('/construction/intelligence/sources');
  const rows = result.data ?? [];

  return (
    <div>
      <PageHeader
        title="Rate sources"
        description="Document registry only. A listed CPWD/PWD source does not mean numeric rates were imported."
      />
      {result.error ? <p>{result.error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--varnarc-muted)] text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Coverage</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--varnarc-border)]">
                <td className="px-3 py-2 font-medium">{row.name}</td>
                <td className="px-3 py-2">{row.sourceType}</td>
                <td className="px-3 py-2">{row.geographicalCoverage ?? '—'}</td>
                <td className="px-3 py-2">
                  {row.sourceUrl ? (
                    <a className="text-[var(--varnarc-brand)] underline" href={row.sourceUrl}>
                      Open
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-xs">{row.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
