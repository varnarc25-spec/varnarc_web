import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AnalyticsData = {
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  featuredCount: number;
  sponsoredCount: number;
  verifiedCount: number;
  leadsByStatus?: Record<string, number>;
};

const sections = [
  { href: '/directory/listings', label: 'Listing manager' },
  { href: '/directory/verification', label: 'Verification queue' },
  { href: '/directory/categories', label: 'Categories' },
  { href: '/directory/leads', label: 'Leads' },
  { href: '/directory/analytics', label: 'Analytics' },
];

export default async function DirectoryAdminDashboardPage() {
  const result = await apiServerFetch<AnalyticsData>('/directory/analytics');
  const stats = result.data;
  const newLeads = stats?.leadsByStatus?.NEW ?? 0;

  return (
    <div>
      <PageHeader
        title="Directory"
        description="Listings, categories, verification, leads, and analytics."
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
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total listings', value: stats?.totalListings ?? 0 },
              { label: 'Approved', value: stats?.approvedListings ?? 0 },
              { label: 'Pending', value: stats?.pendingListings ?? 0 },
              { label: 'New leads', value: newLeads },
              { label: 'Featured', value: stats?.featuredCount ?? 0 },
              { label: 'Sponsored', value: stats?.sponsoredCount ?? 0 },
              { label: 'Verified', value: stats?.verifiedCount ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <p className="text-sm text-[var(--varnarc-subtle)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
              >
                <p className="font-medium">{section.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
