import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';

type CmsSummary = {
  pages: { total: number; published: number; draft: number; scheduled: number };
  articles: { total: number; published: number; draft: number; scheduled: number };
  media: { total: number };
  recentUpdates: Array<{
    id: string;
    type: 'page' | 'article';
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
  }>;
};

export default async function CmsDashboardPage() {
  const result = await apiServerFetch<CmsSummary>('/cms/dashboard/summary');
  const data = result.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="CMS"
        description="Content overview — pages, articles, media, and recent edits."
        actions={<Badge>Content</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load CMS metrics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Pages</CardDescription>
            <CardTitle>{data?.pages.total ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--varnarc-subtle)]">
            {data ? `${data.pages.published} published · ${data.pages.draft} draft` : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Articles</CardDescription>
            <CardTitle>{data?.articles.total ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--varnarc-subtle)]">
            {data
              ? `${data.articles.published} published · ${data.articles.draft} draft`
              : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Scheduled</CardDescription>
            <CardTitle>
              {data ? data.pages.scheduled + data.articles.scheduled : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Media assets</CardDescription>
            <CardTitle>{data?.media.total ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/pages" className="text-[var(--varnarc-brand)] hover:underline">
          Manage pages
        </Link>
        <Link href="/articles" className="text-[var(--varnarc-brand)] hover:underline">
          Manage articles
        </Link>
        <Link href="/media" className="text-[var(--varnarc-brand)] hover:underline">
          Media library
        </Link>
        <Link href="/menus" className="text-[var(--varnarc-brand)] hover:underline">
          Menus
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent updates</h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentUpdates || []).map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 capitalize">{row.type}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={row.type === 'page' ? `/pages/${row.id}` : `/articles/${row.id}`}
                      className="font-medium text-[var(--varnarc-brand)] hover:underline"
                    >
                      {row.title}
                    </Link>
                    <div className="text-xs text-[var(--varnarc-subtle)]">/{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!data?.recentUpdates?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No content yet. Create a page or article to get started.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
