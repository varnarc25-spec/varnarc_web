import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { ReadingHistoryList, type ReadingHistoryItem } from '@/components/reading-history-list';
import { AccountNav } from '@/components/account-nav';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Reading History',
  alternates: { canonical: '/reading-history' },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default async function ReadingHistoryPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const token = await getApiAccessToken();
  let items: ReadingHistoryItem[] = [];
  if (token) {
    const res = await fetch(`${apiUrl}/users/me/reading-history?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: ReadingHistoryItem[] };
      items = json.data ?? [];
    }
  }

  return (
    <PageShell
      title="Reading History"
      description="Articles, guides, calculators, and tools you have opened recently."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Reading History' }]}
    >
      <AccountNav />
      {items.length ? (
        <ReadingHistoryList initialItems={items} />
      ) : (
        <EmptyState
          title="No reading history yet"
          message="Open articles, guides, or calculators while logged in and they will appear here."
        />
      )}
    </PageShell>
  );
}
