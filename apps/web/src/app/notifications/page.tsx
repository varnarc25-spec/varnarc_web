import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { NotificationsInbox } from '@/components/notifications/notifications-inbox';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';
import type { InboxItem } from '@/lib/notifications-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function fetchInboxServer(token: string, limit = 50): Promise<InboxItem[]> {
  const res = await fetch(`${apiUrl}/notifications/me?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: InboxItem[] };
  return json.data ?? [];
}

export const metadata: Metadata = {
  title: 'Notifications',
  alternates: { canonical: '/notifications' },
};

export default async function NotificationsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const token = await getApiAccessToken();
  if (!token) {
    return (
      <PageShell
        title="Notification Center"
        description="Product updates, saved item alerts, and account messages."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
      >
        <EmptyState title="Sign in required" message="Unable to load notifications. Try signing in again." />
      </PageShell>
    );
  }

  const items = await fetchInboxServer(token, 50).catch(() => []);

  return (
    <PageShell
      title="Notification Center"
      description="Product updates, saved item alerts, and account messages."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
    >
      {items.length ? (
        <NotificationsInbox initialItems={items} />
      ) : (
        <EmptyState title="You're all caught up" message="New notifications will appear here." />
      )}
    </PageShell>
  );
}
