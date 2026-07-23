import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { DirectoryCsvToolbar, DirectoryListSearch } from '@/components/directory-admin-toolbar';
import {
  DirectoryActionButton,
  DirectoryListingCreateForm,
} from '@/components/directory-forms';
import { apiServerFetch } from '@/lib/api';

type ListingRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured?: boolean;
  sponsored?: boolean;
  verificationStatus?: string;
  viewCount?: number;
  locations?: Array<{ city: string; country: string }>;
  categories?: Array<{ category: { name: string } }>;
  _count?: { reviews: number; leads: number };
};

export default async function DirectoryListingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);

  const result = await apiServerFetch<ListingRow[]>(`/directory/listings/admin?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Directory listings"
        description="Create, publish, verify, feature, sponsor, and export listings."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <DirectoryListSearch defaultSearch={params.search} defaultStatus={params.status} />
      <DirectoryCsvToolbar />
      <DirectoryListingCreateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load listings</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">
                    {row.locations?.[0]
                      ? `${row.locations[0].city}, ${row.locations[0].country}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    {[
                      row.featured ? 'Featured' : null,
                      row.sponsored ? 'Sponsored' : null,
                      row.verificationStatus === 'VERIFIED' ? 'Verified' : null,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">{row.viewCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/directory/listings/${row.id}/edit`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/directory/${row.slug}`}
                        target="_blank"
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Preview
                      </Link>
                      {row.status !== 'APPROVED' ? (
                        <DirectoryActionButton id={row.id} action="publish" label="Publish" />
                      ) : null}
                      {row.verificationStatus !== 'VERIFIED' ? (
                        <DirectoryActionButton id={row.id} action="verify" label="Verify" />
                      ) : null}
                      {!row.featured ? (
                        <DirectoryActionButton id={row.id} action="feature" label="Feature" />
                      ) : null}
                      {!row.sponsored ? (
                        <DirectoryActionButton id={row.id} action="sponsor" label="Sponsor" />
                      ) : null}
                      <Link
                        href={`/directory/listings/${row.id}/history`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        History
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No listings yet.
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
