import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ModerationActionButtons } from '@/components/review-forms';
import { apiServerFetch } from '@/lib/api';

type ModerationRow = {
  id: string;
  rating: number | string;
  title?: string | null;
  comment?: string | null;
  entityType: string;
  entityId: string;
  status: string;
  user?: { displayName?: string | null; email?: string | null } | null;
};

export default async function ReviewsModerationPage() {
  const result = await apiServerFetch<ModerationRow[]>('/reviews/moderation?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Review moderation"
        description="Approve or reject authenticated user reviews."
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load moderation queue</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    {row.user?.displayName || row.user?.email || '—'}
                  </td>
                  <td className="px-4 py-3">{Number(row.rating).toFixed(1)}</td>
                  <td className="px-4 py-3">{row.title || row.comment?.slice(0, 80) || '—'}</td>
                  <td className="px-4 py-3">
                    {row.entityType} / {row.entityId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <ModerationActionButtons id={row.id} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No reviews pending moderation.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm text-[var(--varnarc-subtle)]">
        <Link href="/reviews" className="text-[var(--varnarc-brand)] hover:underline">
          Back to reviews dashboard
        </Link>
      </p>
    </div>
  );
}
