import { PageHeader, Badge, Card, CardHeader, CardTitle, CardDescription } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type PermissionRow = {
  id: string;
  slug: string;
  name: string;
  module: string;
  description: string | null;
};

export default async function PermissionsPage() {
  const result = await apiServerFetch<PermissionRow[]>('/permissions?pageSize=200');
  const permissions = Array.isArray(result.data) ? result.data : [];
  const modules = [...new Set(permissions.map((p) => p.module))];

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="Granular permissions assigned to roles."
        actions={<Badge>{permissions.length}</Badge>}
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load permissions</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="capitalize">{module}</CardTitle>
                <CardDescription>
                  {permissions.filter((p) => p.module === module).length} permissions
                </CardDescription>
              </CardHeader>
              <ul className="space-y-2 px-6 pb-6 text-sm">
                {permissions
                  .filter((p) => p.module === module)
                  .map((p) => (
                    <li key={p.id} className="flex justify-between gap-4">
                      <span>{p.name}</span>
                      <code className="text-xs text-[var(--varnarc-subtle)]">{p.slug}</code>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
