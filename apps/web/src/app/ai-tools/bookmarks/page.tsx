import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { getApiAccessToken } from '@/lib/api';
import { unwrapList } from '@/components/ai-tools/types';

export const metadata: Metadata = {
  title: 'My AI Tool Bookmarks',
  description: 'Saved AI tools and collections.',
  alternates: { canonical: '/ai-tools/bookmarks' },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type BookmarkRow = {
  id: string;
  collectionName?: string | null;
  tool?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    pricingModel?: string;
    featured?: boolean;
    sponsored?: boolean;
    freePlan?: boolean;
  } | null;
};

async function authedFetch<T>(path: string): Promise<T | null> {
  const token = await getApiAccessToken();
  if (!token) return null;
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: T };
  return json.data ?? null;
}

export default async function AiToolsBookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const params = await searchParams;
  const token = await getApiAccessToken();

  if (!token) {
    return (
      <ContentLayout
        title="Bookmarks"
        description="Sign in to save and organize AI tools."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'AI Tools', href: '/ai-tools' },
          { label: 'Bookmarks' },
        ]}
      >
        <EmptyState title="Sign in required" message="Create an account to bookmark tools into collections." />
      </ContentLayout>
    );
  }

  const qs = new URLSearchParams({ limit: '50' });
  if (params.collection) qs.set('collectionName', params.collection);

  const [bookmarksData, collections, recommendations, recent, follows] = await Promise.all([
    authedFetch<{ items?: BookmarkRow[] } | BookmarkRow[]>(`/ai-tools/bookmarks?${qs}`),
    authedFetch<string[]>('/ai-tools/bookmarks/collections'),
    authedFetch<
      Array<{
        id: string;
        name: string;
        slug: string;
        description?: string | null;
        pricingModel?: string;
        featured?: boolean;
        sponsored?: boolean;
        freePlan?: boolean;
      }>
    >('/ai-tools/me/recommendations'),
    authedFetch<
      Array<{
        tool?: {
          id: string;
          name: string;
          slug: string;
          description?: string | null;
          pricingModel?: string;
          featured?: boolean;
          sponsored?: boolean;
          freePlan?: boolean;
        };
      }>
    >('/ai-tools/me/recently-viewed'),
    authedFetch<
      Array<{
        category?: { id: string; name: string; slug: string; description?: string | null } | null;
      }>
    >('/ai-tools/me/follows'),
  ]);

  const bookmarks = unwrapList(bookmarksData) as BookmarkRow[];
  const collectionNames = Array.isArray(collections) ? collections.filter(Boolean) : [];
  const recs = Array.isArray(recommendations) ? recommendations : [];
  const recentTools = (Array.isArray(recent) ? recent : [])
    .map((r) => r.tool)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const followedCategories = (Array.isArray(follows) ? follows : [])
    .map((f) => f.category)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <ContentLayout
      title="My bookmarks"
      description="Collections, recently viewed tools, and personalized recommendations."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: 'Bookmarks' },
      ]}
    >
      {followedCategories.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Followed categories</h2>
          <div className="flex flex-wrap gap-2">
            {followedCategories.map((c) => (
              <Link
                key={c.id}
                href={`/ai-tools/${c.slug}`}
                className="rounded-md border border-[var(--varnarc-border)] px-3 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {collectionNames.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/ai-tools/bookmarks"
            className={`rounded-md border px-3 py-1.5 text-sm ${!params.collection ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]' : 'border-[var(--varnarc-border)]'}`}
          >
            All
          </Link>
          {collectionNames.map((c) => (
            <Link
              key={c}
              href={`/ai-tools/bookmarks?collection=${encodeURIComponent(c!)}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${params.collection === c ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-muted)]' : 'border-[var(--varnarc-border)]'}`}
            >
              {c}
            </Link>
          ))}
        </div>
      ) : null}

      {bookmarks.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Saved tools</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {bookmarks.map((b) =>
              b.tool ? (
                <div key={b.id}>
                  <AiToolCard
                    name={b.tool.name}
                    slug={b.tool.slug}
                    description={b.tool.description}
                    pricingModel={b.tool.pricingModel}
                    featured={b.tool.featured}
                    sponsored={b.tool.sponsored}
                    freePlan={b.tool.freePlan}
                  />
                  {b.collectionName ? (
                    <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">Collection: {b.collectionName}</p>
                  ) : null}
                </div>
              ) : null,
            )}
          </div>
        </section>
      ) : (
        <EmptyState title="No bookmarks yet" message="Bookmark tools from any tool detail page." />
      )}

      {recentTools.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Recently viewed</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {recentTools.map((t) => (
              <AiToolCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                description={t.description}
                pricingModel={t.pricingModel}
                featured={t.featured}
                sponsored={t.sponsored}
                freePlan={t.freePlan}
              />
            ))}
          </div>
        </section>
      ) : null}

      {recs.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recommended for you</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {recs.map((t) => (
              <AiToolCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                description={t.description}
                pricingModel={t.pricingModel}
                featured={t.featured}
                sponsored={t.sponsored}
                freePlan={t.freePlan}
              />
            ))}
          </div>
        </section>
      ) : null}
    </ContentLayout>
  );
}
