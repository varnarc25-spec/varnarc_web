import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AiCategoryCreateForm } from '@/components/ai-tools-forms';
import { apiServerFetch } from '@/lib/api';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  _count?: { tools: number };
  children?: Array<{ id: string; name: string; slug: string }>;
};

export default async function AiToolsCategoriesAdminPage() {
  const result = await apiServerFetch<CategoryRow[]>('/ai-tools/categories?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="AI tool categories"
        description="Manage hierarchical AI tool categories."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <AiCategoryCreateForm />

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
                <th className="px-4 py-3 font-medium">Tools</th>
                <th className="px-4 py-3 font-medium">Subcategories</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.slug}</td>
                  <td className="px-4 py-3">{row._count?.tools ?? 0}</td>
                  <td className="px-4 py-3">{row.children?.length ?? 0}</td>
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
