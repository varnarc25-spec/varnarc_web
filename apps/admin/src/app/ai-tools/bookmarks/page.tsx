import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type BookmarkStats = {
  total: number;
  byCollection: Array<{ collectionName: string; count: number }>;
};

type Analytics = {
  topBookmarked?: Array<{ id: string; name: string; slug: string; bookmarkCount?: number }>;
  bookmarkStats?: BookmarkStats;
};

export default async function AiToolsBookmarksAdminPage() {
  const [statsResult, analyticsResult] = await Promise.all([
    apiServerFetch<BookmarkStats>('/ai-tools/admin/bookmarks/stats'),
    apiServerFetch<Analytics>('/ai-tools/analytics'),
  ]);

  const stats = statsResult.data;
  const top = analyticsResult.data?.topBookmarked ?? [];

  return (
    <div>
      <PageHeader
        title="AI tool bookmarks"
        description="Engagement overview for user-owned bookmarks and collections."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total bookmarks</CardTitle>
            <CardDescription className="text-2xl font-semibold text-[var(--varnarc-ink)]">
              {stats?.total ?? 0}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
            <CardDescription className="text-2xl font-semibold text-[var(--varnarc-ink)]">
              {stats?.byCollection?.length ?? 0}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top tools tracked</CardTitle>
            <CardDescription className="text-2xl font-semibold text-[var(--varnarc-ink)]">
              {top.length}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By collection</CardTitle>
            <CardDescription>Named collections used by signed-in users.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 px-6 pb-6 text-sm">
            {(stats?.byCollection ?? []).map((c) => (
              <li key={c.collectionName} className="flex justify-between">
                <span>{c.collectionName}</span>
                <span className="text-[var(--varnarc-subtle)]">{c.count}</span>
              </li>
            ))}
            {!stats?.byCollection?.length ? (
              <li className="text-[var(--varnarc-subtle)]">No collection data yet.</li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most bookmarked tools</CardTitle>
            <CardDescription>Public catalog leaders by bookmark count.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 px-6 pb-6 text-sm">
            {top.map((t) => (
              <li key={t.id} className="flex justify-between gap-3">
                <Link href={`/ai-tools/tools`} className="text-[var(--varnarc-brand)] hover:underline">
                  {t.name}
                </Link>
                <span className="text-[var(--varnarc-subtle)]">{t.bookmarkCount ?? 0}</span>
              </li>
            ))}
            {!top.length ? <li className="text-[var(--varnarc-subtle)]">No bookmark leaders yet.</li> : null}
          </ul>
        </Card>
      </div>

      <p className="mt-6 text-sm text-[var(--varnarc-subtle)]">
        Individual bookmarks remain user-owned on the public site (
        <code className="text-xs">/ai-tools/bookmarks</code>).
      </p>
    </div>
  );
}
