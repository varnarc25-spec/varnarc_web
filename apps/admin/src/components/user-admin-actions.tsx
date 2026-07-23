'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@varnarc/ui';

export function UserAdminActions({
  userId,
  currentStatus,
  currentRoleIds,
  roles,
}: {
  userId: string;
  currentStatus: string;
  currentRoleIds: string[];
  roles: Array<{ id: string; slug: string; name: string }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [roleIds, setRoleIds] = useState<string[]>(currentRoleIds);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function call(path: string, body: unknown) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account status</CardTitle>
          <CardDescription>Enable or disable this user account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
            <option value="PENDING">PENDING</option>
          </select>
          <Button
            disabled={loading}
            onClick={() =>
              void call('/api/admin/users/status', { userId, status })
            }
          >
            Update status
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign roles</CardTitle>
          <CardDescription>RBAC roles stored in Neon (not Auth0).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {roles.map((role) => {
              const checked = roleIds.includes(role.id);
              return (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setRoleIds((prev) =>
                        e.target.checked
                          ? [...prev, role.id]
                          : prev.filter((id) => id !== role.id),
                      );
                    }}
                  />
                  <span>
                    {role.name} <span className="text-[var(--varnarc-subtle)]">({role.slug})</span>
                  </span>
                </label>
              );
            })}
          </div>
          <Button
            disabled={loading}
            onClick={() => void call('/api/admin/users/roles', { userId, roleIds })}
          >
            Save roles
          </Button>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-[var(--varnarc-subtle)] lg:col-span-2">{message}</p> : null}
    </div>
  );
}
