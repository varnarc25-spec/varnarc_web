const publicWebUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CommentsModerationTable } from '@/components/comments-moderation-table';

type CommentRow = {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  user?: { displayName?: string | null; email?: string | null; username?: string | null } | null;
  article?: { title: string; slug: string } | null;
};

export default async function ArticleCommentsModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; flagged?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status === 'DRAFT' ||
    params.status === 'REVIEW' ||
    params.status === 'PUBLISHED' ||
    params.status === 'ARCHIVED'
      ? params.status
      : undefined;
  const flagged = params.flagged === 'true';

  const qs = new URLSearchParams({ limit: '50' });
  if (status) qs.set('status', status);
  if (flagged) qs.set('flagged', 'true');

  const result = await apiServerFetch<CommentRow[]>(
    `/article-comments/moderation/list?${qs.toString()}`,
  );
  const rows = result.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Article comments"
        description="Moderate reader comments — approve, archive, or bulk-manage spam queue."
      />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ''}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="PUBLISHED">Published</option>
            <option value="REVIEW">Review (spam queue)</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="flagged" value="true" defaultChecked={flagged} />
          Spam queue only
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--varnarc-brand)] px-4 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load comments</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <CommentsModerationTable rows={rows} publicWebUrl={publicWebUrl} />
      )}
    </div>
  );
}
