import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Dashboard = {
  notificationCount?: number;
  templateCount?: number;
  unreadCount?: number;
};

export default async function NotificationsDashboardPage() {
  const result = await apiServerFetch<Dashboard>('/notifications/dashboard');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="In-app messages, templates, broadcasts, and delivery providers."
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/notifications/templates" className="text-[var(--varnarc-brand)] hover:underline">
          Templates
        </Link>
        <Link href="/notifications/newsletter-templates" className="text-[var(--varnarc-brand)] hover:underline">
          Newsletter templates
        </Link>
        <Link href="/notifications/campaigns" className="text-[var(--varnarc-brand)] hover:underline">
          Newsletter campaigns
        </Link>
        <Link href="/notifications/subscribers" className="text-[var(--varnarc-brand)] hover:underline">
          Newsletter subscribers
        </Link>
        <Link href="/notifications/broadcast" className="text-[var(--varnarc-brand)] hover:underline">
          Broadcast
        </Link>
        <Link href="/notifications/providers" className="text-[var(--varnarc-brand)] hover:underline">
          Providers
        </Link>
      </div>
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Kpi title="Notifications sent" value={result.data?.notificationCount ?? 0} />
          <Kpi title="Templates" value={result.data?.templateCount ?? 0} />
          <Kpi title="Unread (all users)" value={result.data?.unreadCount ?? 0} />
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
