import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CatalogImportForm } from '@/components/catalog/catalog-import-form';
import { CATALOG_ENTITIES } from '@varnarc/validation';

type Counts = {
  finance?: Record<string, number>;
  construction?: Record<string, number>;
  automobile?: Record<string, number>;
  total?: number;
};

export default async function CatalogOpsPage() {
  const countsResult = await apiServerFetch<Counts>('/catalog/ops/counts');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Catalog ops"
        description="Large-scale CSV imports for finance, construction, and automobile production catalogs."
      />

      {countsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load counts</CardTitle>
            <CardDescription>{countsResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <CountCard title="Finance rows" value={sumObject(countsResult.data?.finance)} />
          <CountCard title="Construction rows" value={sumObject(countsResult.data?.construction)} />
          <CountCard title="Automobile rows" value={sumObject(countsResult.data?.automobile)} />
        </div>
      )}

      <CatalogImportForm />

      <section className="text-sm text-[var(--varnarc-subtle)]">
        <h3 className="mb-2 font-semibold text-[var(--varnarc-ink)]">Supported entities</h3>
        <ul className="list-inside list-disc space-y-1">
          {Object.entries(CATALOG_ENTITIES).map(([vertical, entities]) => (
            <li key={vertical}>
              <span className="font-medium capitalize">{vertical}</span>: {entities.join(', ')}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          CLI: <code className="rounded bg-slate-100 px-1">pnpm catalog:import -- --vertical finance --entity loans --file ./data/loans.csv</code>
        </p>
        <p className="mt-2">
          Templates: see <code className="rounded bg-slate-100 px-1">data/catalog-templates/README.md</code> in the repo.
        </p>
        <p className="mt-2">
          Per-vertical tools:{' '}
          <Link href="/finance" className="text-[var(--varnarc-brand)] hover:underline">
            Finance
          </Link>
          ,{' '}
          <Link href="/construction" className="text-[var(--varnarc-brand)] hover:underline">
            Construction
          </Link>
          ,{' '}
          <Link href="/automobile" className="text-[var(--varnarc-brand)] hover:underline">
            Automobile
          </Link>
        </p>
      </section>
    </div>
  );
}

function CountCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value.toLocaleString()}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function sumObject(obj?: Record<string, number>) {
  if (!obj) return 0;
  return Object.values(obj).reduce((a, b) => a + b, 0);
}
