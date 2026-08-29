'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@varnarc/ui';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Login failed');
      const returnTo = searchParams.get('returnTo') || '/';
      router.replace(returnTo.startsWith('/') ? returnTo : '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <label className="block text-sm">
        Email
        <input
          type="email"
          required
          autoComplete="username"
          className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
