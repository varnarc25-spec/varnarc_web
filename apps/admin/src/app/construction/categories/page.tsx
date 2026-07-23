import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionCategoryForm } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number | null;
};

export default async function ConstructionCategoriesAdminPage() {
  const result = await apiServerFetch<CategoryRow[]>('/construction/categories');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Construction categories"
        description="Organize materials and templates under construction categories."
        actions={<Badge>{rows.length} categories</Badge>}
      />

      <ConstructionCategoryForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load categories</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                  <td className="px-4 py-3">{row.sortOrder ?? 0}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">{row.description || '—'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No categories yet.
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
