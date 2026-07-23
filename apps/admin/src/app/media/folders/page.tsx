import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { MediaFolderForm } from '@/components/media-folder-form';

type FolderRow = {
  id: string;
  name: string;
  slug: string;
  path?: string | null;
  parentId?: string | null;
};

export default async function MediaFoldersPage() {
  const result = await apiServerFetch<FolderRow[]>('/media/folders?parentId=all');
  const folders = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Media folders"
        description="Organize assets into folders. Folders must be empty before deletion."
        actions={
          <Link href="/media" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to library
          </Link>
        }
      />

      <MediaFolderForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load folders</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Slug</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <tr key={folder.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">{folder.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--varnarc-subtle)]">
                    {folder.path || folder.slug}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{folder.slug}</td>
                </tr>
              ))}
              {!folders.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No folders yet.
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
