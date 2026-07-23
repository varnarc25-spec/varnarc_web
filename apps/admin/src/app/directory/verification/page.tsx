import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { DirectoryActionButton } from '@/components/directory-forms';
import { apiServerFetch } from '@/lib/api';

type ListingRow = {
  id: string;
  name: string;
  slug: string;
  verificationStatus?: string;
  status: string;
  locations?: Array<{ city: string; country: string }>;
  categories?: Array<{ category: { name: string } }>;
};

export default async function DirectoryVerificationPage() {
  const result = await apiServerFetch<ListingRow[]>('/directory/listings/admin/verification?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Verification queue"
        description="Review and verify pending directory listings."
        actions={<Badge>{rows.length} pending</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load queue</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.categories?.[0]?.category.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {row.locations?.[0] ? `${row.locations[0].city}, ${row.locations[0].country}` : '—'}
                  </td>
                  <td className="px-4 py-3">{row.verificationStatus ?? row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <DirectoryActionButton id={row.id} action="verify" label="Verify" />
                      <DirectoryActionButton id={row.id} action="publish" label="Publish" />
                      <Link href={`/directory/listings/${row.id}/history`} className="text-sm text-[var(--varnarc-brand)] hover:underline">
                        History
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No listings awaiting verification.
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
