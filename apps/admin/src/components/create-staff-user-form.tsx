'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { useRouter } from 'next/navigation';

export function CreateStaffUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleSlug, setRoleSlug] = useState('admin');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          displayName: displayName || null,
          roleSlug,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Could not create user');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setMessage('Staff user created.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3';

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h2 className="text-sm font-semibold">Create office user</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Email
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Password
          <input
            className={inputClass}
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Display name
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Role
          <select
            className={inputClass}
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
          <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
            Super admin is reserved for business@varnarc.com.
          </p>
        </label>
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? 'Creating…' : 'Create user'}
      </Button>
    </div>
  );
}
