import { PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { RoleEditForm } from '@/components/role-edit-form';
import Link from 'next/link';

type RoleDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  permissions: Array<{ id: string; slug: string; name: string; module: string }>;
};

type PermissionRow = {
  id: string;
  slug: string;
  name: string;
  module: string;
};

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roleRes = await apiServerFetch<RoleDetail>(`/roles/${id}`);
  const permsRes = await apiServerFetch<PermissionRow[]>('/permissions?pageSize=200');

  if (!roleRes.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role not found</CardTitle>
          <CardDescription>{roleRes.error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={roleRes.data.name}
        description={roleRes.data.slug}
        actions={
          <Link href="/roles" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to roles
          </Link>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>{roleRes.data.description || '—'}</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleEditForm
            roleId={roleRes.data.id}
            name={roleRes.data.name}
            description={roleRes.data.description}
            permissionIds={roleRes.data.permissions.map((p) => p.id)}
            permissions={Array.isArray(permsRes.data) ? permsRes.data : []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
