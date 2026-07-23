import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Supplier = {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  phone?: string | null;
  description?: string | null;
  sponsored?: boolean;
  category?: string | null;
};

type SuppliersPayload = {
  businesses?: Supplier[];
  categories?: Array<{ name: string; href: string }>;
  directoryHref?: string;
};

export default async function ConstructionSuppliersAdminPage() {
  const result = await apiServerFetch<SuppliersPayload>('/construction/admin/suppliers');
  const businesses = result.data?.businesses ?? [];
  const categories = result.data?.categories ?? [];

  return (
    <div>
      <PageHeader
        title="Supplier integration"
        description="Construction suppliers linked from the business directory."
        actions={<Badge>{businesses.length} linked</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load suppliers</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Directory categories</CardTitle>
              <CardDescription>
                Businesses in these directory categories appear on the public suppliers page.
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2 px-6 pb-6">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="rounded-full border border-[var(--varnarc-border)] px-3 py-1 text-sm hover:bg-[var(--varnarc-muted)]"
                  target="_blank"
                >
                  {cat.name}
                </Link>
              ))}
              {!categories.length ? (
                <p className="text-sm text-[var(--varnarc-subtle)]">No construction directory categories yet.</p>
              ) : null}
            </div>
          </Card>

          <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Sponsored</th>
                  <th className="px-4 py-3 font-medium">Public</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr key={biz.id} className="border-b border-[var(--varnarc-border)]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{biz.name}</div>
                      {biz.phone ? <div className="text-xs text-[var(--varnarc-subtle)]">{biz.phone}</div> : null}
                    </td>
                    <td className="px-4 py-3">{biz.category || '—'}</td>
                    <td className="px-4 py-3">{biz.city || '—'}</td>
                    <td className="px-4 py-3">{biz.sponsored ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/directory/${biz.slug}`}
                        className="text-[var(--varnarc-brand)] hover:underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {!businesses.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                      No linked suppliers. Approve directory businesses in construction categories to populate this list.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
