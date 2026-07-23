import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type AffiliateProduct = {
  id: string;
  name: string;
  slug: string;
  affiliateUrl?: string | null;
  entity: string;
};

type AffiliateStats = {
  totalProducts?: number;
  withAffiliateUrl?: number;
  clicks?: number;
  ctr?: number | string | null;
};

export default async function FinanceAffiliatesAdminPage() {
  const [loansRes, cardsRes, insuranceRes, investmentsRes, statsRes] = await Promise.all([
    apiServerFetch<Array<{ id: string; name: string; slug: string; affiliateUrl?: string | null }>>(
      '/finance/admin/loans?limit=100',
    ),
    apiServerFetch<Array<{ id: string; name: string; slug: string; affiliateUrl?: string | null }>>(
      '/finance/admin/credit-cards?limit=100',
    ),
    apiServerFetch<Array<{ id: string; name: string; slug: string; affiliateUrl?: string | null }>>(
      '/finance/admin/insurance?limit=100',
    ),
    apiServerFetch<Array<{ id: string; name: string; slug: string; affiliateUrl?: string | null }>>(
      '/finance/admin/investments?limit=100',
    ),
    apiServerFetch<AffiliateStats>('/finance/admin/affiliate-stats'),
  ]);

  const products: AffiliateProduct[] = [
    ...(loansRes.data ?? []).map((p) => ({ ...p, entity: 'loans' })),
    ...(cardsRes.data ?? []).map((p) => ({ ...p, entity: 'credit-cards' })),
    ...(insuranceRes.data ?? []).map((p) => ({ ...p, entity: 'insurance' })),
    ...(investmentsRes.data ?? []).map((p) => ({ ...p, entity: 'investments' })),
  ].filter((p) => p.affiliateUrl);

  const stats = statsRes.data;

  return (
    <div>
      <PageHeader
        title="Affiliate manager"
        description="Products with affiliate URLs and click tracking."
        actions={<Badge>{products.length} with links</Badge>}
      />

      {stats ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total products', value: stats.totalProducts ?? products.length },
            { label: 'With affiliate URL', value: stats.withAffiliateUrl ?? products.length },
            { label: 'Clicks', value: stats.clicks ?? 0 },
            { label: 'CTR', value: stats.ctr != null ? `${stats.ctr}%` : '—' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <div className="text-xs text-[var(--varnarc-subtle)]">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tracking endpoint</CardTitle>
          <CardDescription>
            Affiliate clicks are tracked via{' '}
            <code className="rounded bg-[var(--varnarc-muted)] px-1">POST /api/v1/finance/affiliate/track</code>{' '}
            with product id and entity type.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Affiliate URL</th>
            </tr>
          </thead>
          <tbody>
            {products.map((row) => (
              <tr key={`${row.entity}-${row.id}`} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                </td>
                <td className="px-4 py-3">{row.entity}</td>
                <td className="px-4 py-3">
                  <a
                    href={row.affiliateUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-[var(--varnarc-brand)] hover:underline"
                  >
                    {row.affiliateUrl}
                  </a>
                </td>
              </tr>
            ))}
            {!products.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No products with affiliate URLs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-[var(--varnarc-subtle)]">
        Edit affiliate URLs on individual product edit pages (loans support inline edit).
      </p>
    </div>
  );
}
