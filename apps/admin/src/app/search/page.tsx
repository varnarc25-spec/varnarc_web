import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SearchReindexConsole } from '@/components/search/search-reindex-console';

type Health = {
  total?: number;
  byType?: Array<{ entityType: string; count: number }>;
  engine?: string;
};

type Analytics = {
  volume30d?: number;
  avgLatencyMs?: number | null;
  ctr?: number;
  indexTotal?: number;
};

export default async function SearchAdminPage() {
  const [healthRes, analyticsRes] = await Promise.all([
    apiServerFetch<Health>('/search/index'),
    apiServerFetch<Analytics>('/search/analytics'),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Search"
        description="Unified search index, reindex console, and analytics."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/search/index" className="text-[var(--varnarc-brand)] hover:underline">
          Index manager
        </Link>
        <Link href="/search/analytics" className="text-[var(--varnarc-brand)] hover:underline">
          Analytics
        </Link>
      </div>

      {healthRes.error || analyticsRes.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load search dashboard</CardTitle>
            <CardDescription>{healthRes.error || analyticsRes.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Index health</h2>
            <ul className="space-y-2 text-sm">
              <li>Documents: {healthRes.data?.total ?? 0}</li>
              <li>Engine: {healthRes.data?.engine ?? 'postgres-fts'}</li>
              <li>Volume (30d): {analyticsRes.data?.volume30d ?? 0}</li>
              <li>Avg latency: {analyticsRes.data?.avgLatencyMs != null ? `${Math.round(analyticsRes.data.avgLatencyMs)} ms` : '—'}</li>
              <li>CTR: {analyticsRes.data?.ctr != null ? `${(analyticsRes.data.ctr * 100).toFixed(1)}%` : '—'}</li>
            </ul>
          </section>
          <SearchReindexConsole />
        </div>
      )}
    </div>
  );
}
