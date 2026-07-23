import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { LeadStatusSelect } from '@/components/directory-forms';
import { apiServerFetch } from '@/lib/api';

type LeadRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  leadType: string;
  status: string;
  createdAt: string;
  business?: { id: string; name: string; slug: string };
};

export default async function DirectoryLeadsAdminPage() {
  const result = await apiServerFetch<LeadRow[]>('/directory/leads?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Directory leads"
        description="Contact, quote, and appointment requests from listings."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load leads</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.business?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div>{row.name}</div>
                    <div className="text-[var(--varnarc-subtle)]">{row.email || row.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{row.leadType}</td>
                  <td className="max-w-xs truncate px-4 py-3">{row.message || '—'}</td>
                  <td className="px-4 py-3">
                    <LeadStatusSelect id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No leads yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
