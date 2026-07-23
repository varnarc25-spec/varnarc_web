'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function ApiKeyCreateForm() {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function create() {
    setMessage(null);
    setCreatedKey(null);
    const res = await fetch('/api/admin/platform/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        scopes: scopes.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      data?: { key?: string };
    };
    if (!res.ok) throw new Error(json.error?.message || 'Create failed');
    setCreatedKey(json.data?.key ?? null);
    setMessage('API key created. Copy it now — it will not be shown again.');
    setName('');
    setScopes('');
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Create API key</h3>
      <label className="block text-sm">
        Name
        <input className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-sm">
        Scopes (comma-separated)
        <input className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3" value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="read:articles" />
      </label>
      <Button type="button" disabled={!name} onClick={() => void create().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed'))}>
        Create key
      </Button>
      {createdKey ? (
        <pre className="overflow-x-auto rounded-md bg-[var(--varnarc-muted)] p-3 text-xs">{createdKey}</pre>
      ) : null}
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
