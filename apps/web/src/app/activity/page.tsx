import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { ActivityTimeline, type ActivityItem } from '@/components/activity-timeline';
import { AccountNav } from '@/components/account-nav';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';

export const metadata: Metadata = {
  title: 'My Activity',
  alternates: { canonical: '/activity' },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default async function ActivityPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const token = await getApiAccessToken();
  let items: ActivityItem[] = [];
  if (token) {
    const res = await fetch(`${apiUrl}/users/me/activity?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: ActivityItem[] };
      items = json.data ?? [];
    }
  }

  return (
    <PageShell
      title="My Activity"
      description="Recent actions on your account — bookmarks, profile updates, and more."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Activity' }]}
    >
      <AccountNav />
      {items.length ? (
        <ActivityTimeline items={items} />
      ) : (
        <EmptyState
          title="No activity yet"
          message="Actions like saving bookmarks or updating your profile will appear here."
        />
      )}
    </PageShell>
  );
}
