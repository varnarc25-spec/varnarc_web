import { PageHeader, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { UserAdminActions } from '@/components/user-admin-actions';
import Link from 'next/link';

type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  status: string;
  roles: string[];
  roleDetails: Array<{ id: string; slug: string; name: string }>;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
};

type RoleRow = {
  id: string;
  slug: string;
  name: string;
};

type LoginRow = {
  id: string;
  ipAddress: string | null;
  browser: string | null;
  device: string | null;
  loginTime: string;
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userRes = await apiServerFetch<AdminUser>(`/users/${id}`);
  const rolesRes = await apiServerFetch<RoleRow[]>(`/roles?pageSize=100`);
  const historyRes = await apiServerFetch<LoginRow[]>(`/users/${id}/login-history?pageSize=20`);

  if (!userRes.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User not found</CardTitle>
          <CardDescription>{userRes.error || 'Unable to load user.'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const user = userRes.data;
  const roles = Array.isArray(rolesRes.data) ? rolesRes.data : [];
  const history = Array.isArray(historyRes.data) ? historyRes.data : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={user.displayName || user.email}
        description={user.email}
        actions={
          <Link href="/users" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to users
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle>
              <Badge>{user.status}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Roles</CardDescription>
            <CardTitle className="text-base">{user.roles.join(', ') || '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last login</CardDescription>
            <CardTitle className="text-base">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <UserAdminActions
        userId={user.id}
        currentStatus={user.status}
        currentRoleIds={user.roleDetails?.map((r) => r.id) || []}
        roles={roles}
      />

      <Card>
        <CardHeader>
          <CardTitle>Login history</CardTitle>
          <CardDescription>Recent authentication events for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {history.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-1 border-b border-[var(--varnarc-border)] py-2 last:border-0 sm:flex-row sm:justify-between"
              >
                <span>{new Date(row.loginTime).toLocaleString()}</span>
                <span className="text-[var(--varnarc-subtle)]">
                  {[row.ipAddress, row.device, row.browser].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>
            ))}
            {!history.length ? (
              <p className="text-[var(--varnarc-subtle)]">No login history yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
