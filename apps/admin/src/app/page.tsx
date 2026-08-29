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
import type { CurrentUser } from '@varnarc/types';
import { hasPermission, PERMISSIONS, isAdminRole } from '@varnarc/auth';

type DashboardSummary = {
  users: {
    total: number;
    active: number;
    disabled: number;
    loggedInLast7Days: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
    user: { id: string; email: string; displayName: string | null } | null;
  }>;
  generatedAt: string;
};

export default async function AdminDashboardPage() {
  const me = await apiServerFetch<CurrentUser>('/auth/me');
  const summary = await apiServerFetch<DashboardSummary>('/dashboard/summary');

  const user = me.data;
  const canExport =
    user &&
    (hasPermission(user.permissions, PERMISSIONS.REPORTS_EXPORT) || isAdminRole(user.roles));
  const canAudit =
    user && (hasPermission(user.permissions, PERMISSIONS.AUDIT_VIEW) || isAdminRole(user.roles));

  const metrics = summary.data?.users;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Operational overview for office staff."
        actions={<Badge>Staff login</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total users</CardDescription>
            <CardTitle>{metrics?.total ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active</CardDescription>
            <CardTitle>{metrics?.active ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Disabled</CardDescription>
            <CardTitle>{metrics?.disabled ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Logins (7d)</CardDescription>
            <CardTitle>{metrics?.loggedInLast7Days ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Signed in as</CardDescription>
            <CardTitle className="text-base">{user?.email || '—'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-[var(--varnarc-subtle)]">
            <div>Roles: {(user?.roles || []).join(', ') || 'none'}</div>
            <div>Permissions: {user?.permissions?.length ?? 0}</div>
            <div>Auth: office accounts (email / password)</div>
            {summary.error ? <div className="text-amber-700">Metrics: {summary.error}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Quick actions</CardDescription>
            <CardTitle className="text-base">Admin tools</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Link href="/users" className="text-[var(--varnarc-brand)] hover:underline">
              Manage users
            </Link>
            <Link href="/roles" className="text-[var(--varnarc-brand)] hover:underline">
              Roles & permissions
            </Link>
            {canAudit ? (
              <Link href="/audit" className="text-[var(--varnarc-brand)] hover:underline">
                Audit logs
              </Link>
            ) : null}
            <Link href="/settings" className="text-[var(--varnarc-brand)] hover:underline">
              Settings
            </Link>
            {canExport ? (
              <a
                href="/api/admin/reports/users"
                className="text-[var(--varnarc-brand)] hover:underline"
              >
                Export users CSV
              </a>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--varnarc-ink)]">Recent activity</h2>
          {canAudit ? (
            <Link href="/audit" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              View all
            </Link>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {(summary.data?.recentActivity || []).map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{row.user?.displayName || row.user?.email || '—'}</td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {row.entity}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
                  </td>
                </tr>
              ))}
              {!summary.data?.recentActivity?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No recent admin activity yet.
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
