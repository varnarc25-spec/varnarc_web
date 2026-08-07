import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceGuideForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type GuideRow = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  status?: string;
  category?: { name: string } | null;
};

type CategoryRow = { id: string; name: string };

export default async function FinanceGuidesAdminPage() {
  const [guidesResult, categoriesResult] = await Promise.all([
    apiServerFetch<GuideRow[]>('/finance/admin/guides'),
    apiServerFetch<CategoryRow[]>('/finance/categories'),
  ]);
  const rows = Array.isArray(guidesResult.data) ? guidesResult.data : [];
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];

  return (
    <div>
      <PageHeader
        title="Finance guides"
        description="Manage educational guides with SEO titles and descriptions."
        actions={<Badge>{rows.length} guides</Badge>}
      />

      <FinanceGuideForm categories={categories} />

      {guidesResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load guides</CardTitle>
            <CardDescription>{guidesResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <div>
                {row.category?.name ? (
                  <div className="text-xs font-medium uppercase text-[var(--varnarc-subtle)]">
                    {row.category.name}
                  </div>
                ) : null}
                <div className="font-medium">{row.title}</div>
                <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                {row.summary ? (
                  <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{row.summary}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {row.status ? <Badge>{row.status}</Badge> : null}
                <Link
                  href={`/finance/guides/${row.id}`}
                  className="text-sm text-[var(--varnarc-brand)] hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {!rows.length ? (
            <p className="py-8 text-center text-[var(--varnarc-subtle)]">No guides yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
