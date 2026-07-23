import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SearchReindexConsole } from '@/components/search/search-reindex-console';

type Health = {
  total?: number;
  byType?: Array<{ entityType: string; count: number }>;
  engine?: string;
  vector?: string;
};

export default async function SearchIndexAdminPage() {
  const result = await apiServerFetch<Health>('/search/index');

  return (
    <div className="space-y-8">
      <PageHeader title="Search index" description="Index health and reindex by module." />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load index</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
            <h2 className="mb-3 font-semibold">Documents by type</h2>
            <ul className="space-y-2 text-sm">
              <li>Total: {result.data?.total ?? 0}</li>
              <li>Engine: {result.data?.engine}</li>
              <li>Vector: {result.data?.vector}</li>
              {(result.data?.byType ?? []).map((row) => (
                <li key={row.entityType}>
                  {row.entityType}: {row.count}
                </li>
              ))}
              {!(result.data?.byType ?? []).length ? (
                <li className="text-[var(--varnarc-subtle)]">Empty index — run a reindex.</li>
              ) : null}
            </ul>
          </section>
          <SearchReindexConsole />
        </div>
      )}
    </div>
  );
}
