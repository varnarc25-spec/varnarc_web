import { PageHeader, Badge, Card, CardHeader, CardTitle, CardDescription } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import Link from 'next/link';

type RoleRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  userCount: number;
  permissions: Array<{ slug: string }>;
};

export default async function RolesPage() {
  const result = await apiServerFetch<RoleRow[]>('/roles?pageSize=100');
  const roles = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Application RBAC roles and their permissions."
        actions={<Badge>{roles.length} roles</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load roles</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/roles/${role.id}`} className="hover:underline">
                    {role.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {role.slug} · {role.userCount} users · {role.permissions.length} permissions
                </CardDescription>
              </CardHeader>
              <p className="px-6 pb-6 text-sm text-[var(--varnarc-subtle)]">
                {role.description || 'No description'}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
