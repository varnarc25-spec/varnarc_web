import { PageHeader, Badge, Card, CardHeader, CardTitle, CardDescription } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import Link from 'next/link';

type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ pageSize: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<AdminUser[]>(`/users?${qs.toString()}`);
  // list returns { success, data, meta } — apiServerFetch extracts data
  const users = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage Auth0-synced users, roles, and account status."
        actions={
          <div className="flex items-center gap-3">
            <a
              href={`/api/admin/reports/users${params.search ? `?search=${encodeURIComponent(params.search)}` : ''}`}
              className="text-sm text-[var(--varnarc-brand)] hover:underline"
            >
              Export CSV
            </a>
            <Badge>{users.length} loaded</Badge>
          </div>
        }
      />

      <form className="mb-6 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search email or name…"
          className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load users</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/users/${user.id}`} className="font-medium text-[var(--varnarc-brand)] hover:underline">
                      {user.displayName || user.email}
                    </Link>
                    <div className="text-xs text-[var(--varnarc-subtle)]">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">{user.status}</td>
                  <td className="px-4 py-3">{(user.roles || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No users yet. Sign in once to sync your Auth0 profile.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
