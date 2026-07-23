import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { BookmarksList, type BookmarkItem } from '@/components/bookmarks-list';
import { AccountNav } from '@/components/account-nav';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Bookmarks',
  alternates: { canonical: '/bookmarks' },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default async function BookmarksPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const token = await getApiAccessToken();
  let items: BookmarkItem[] = [];
  if (token) {
    const res = await fetch(`${apiUrl}/users/me/bookmarks?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: BookmarkItem[] };
      items = json.data ?? [];
    }
  }

  return (
    <PageShell
      title="Bookmarks"
      description="Articles, tools, and listings you save for later."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Bookmarks' }]}
    >
      <AccountNav />
      {items.length ? (
        <BookmarksList initialItems={items} />
      ) : (
        <EmptyState title="Nothing saved yet" message="Save articles and tools to find them here." />
      )}
    </PageShell>
  );
}
