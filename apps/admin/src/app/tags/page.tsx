import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { TagCreateForm } from '@/components/tag-create-form';

type TagRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
};

export default async function TagsAdminPage() {
  const result = await apiServerFetch<TagRow[]>('/tags?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Label articles for discovery and related content."
        actions={<Badge>{rows.length} loaded</Badge>}
      />
      <TagCreateForm />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load tags</CardTitle>
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
                <th className="px-4 py-3 font-medium">Usage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    {row.description ? (
                      <div className="text-xs text-[var(--varnarc-subtle)]">{row.description}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                  <td className="px-4 py-3">{row._count?.articles ?? 0}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No tags yet.
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
