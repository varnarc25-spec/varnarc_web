'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function RoleEditForm({
  roleId,
  name,
  description,
  permissionIds,
  permissions,
}: {
  roleId: string;
  name: string;
  description: string | null;
  permissionIds: string[];
  permissions: Array<{ id: string; slug: string; name: string; module: string }>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(permissionIds);
  const [roleName, setRoleName] = useState(name);
  const [roleDescription, setRoleDescription] = useState(description || '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/roles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          name: roleName,
          description: roleDescription,
          permissionIds: selected,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string }; success?: boolean };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  const modules = [...new Set(permissions.map((p) => p.module))];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Name</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Description</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module}>
            <h4 className="mb-2 text-sm font-semibold capitalize">{module}</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions
                .filter((p) => p.module === module)
                .map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(permission.id)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, permission.id]
                            : prev.filter((id) => id !== permission.id),
                        );
                      }}
                    />
                    <span>
                      {permission.name}{' '}
                      <span className="text-[var(--varnarc-subtle)]">({permission.slug})</span>
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Button disabled={loading} onClick={() => void save()}>
        Save role
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
