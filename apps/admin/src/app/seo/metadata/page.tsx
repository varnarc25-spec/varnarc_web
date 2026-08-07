import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { SeoMetadataEditForm } from '@/components/seo-metadata-editor';
import { apiServerFetch } from '@/lib/api';

type MetadataRow = {
  id: string;
  entityType: string;
  entityId: string;
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  updatedAt: string;
};

export default async function SeoMetadataPage() {
  const result = await apiServerFetch<MetadataRow[]>('/seo/meta?limit=50');

  return (
    <div className="space-y-8">
      <PageHeader
        title="SEO Metadata"
        description="Centralized metadata overrides by entity. Click a row to expand and edit."
      />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load metadata</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
                <th className="px-3 py-2 text-left">Entity</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Canonical</th>
                <th className="px-3 py-2 text-left">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(result.data ?? []).map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)] align-top">
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.entityType}:{row.entityId.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2">{row.title ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.canonicalUrl ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div>{new Date(row.updatedAt).toLocaleString()}</div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-[var(--varnarc-brand)]">
                        Edit
                      </summary>
                      <div className="mt-2 min-w-[20rem]">
                        <SeoMetadataEditForm
                          entityType={row.entityType}
                          entityId={row.entityId}
                          initial={{
                            title: row.title,
                            description: row.description,
                          }}
                        />
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
