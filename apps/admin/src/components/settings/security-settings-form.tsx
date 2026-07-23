'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type SecuritySettings = {
  rateLimitPerMinute?: number;
  corsOrigins?: string[];
  cspEnabled?: boolean;
  cspReportOnly?: boolean;
  allowedOrigins?: string[];
  apiKeyRequired?: boolean;
  passwordMinLength?: number;
};

export function SecuritySettingsForm({ initial }: { initial: SecuritySettings }) {
  const [form, setForm] = useState<SecuritySettings>(initial);
  const [corsOrigins, setCorsOrigins] = useState((initial.corsOrigins ?? []).join('\n'));
  const [allowedOrigins, setAllowedOrigins] = useState((initial.allowedOrigins ?? []).join('\n'));
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const body = {
      ...form,
      corsOrigins: corsOrigins.split('\n').map((s) => s.trim()).filter(Boolean),
      allowedOrigins: allowedOrigins.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch('/api/admin/settings/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || 'Save failed');
    setMessage('Saved.');
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <label className="block text-sm">
        Rate limit (requests per minute)
        <input
          type="number"
          className="mt-1 block h-10 w-32 rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.rateLimitPerMinute ?? 120}
          onChange={(e) => setForm((prev) => ({ ...prev, rateLimitPerMinute: Number(e.target.value) }))}
        />
      </label>
      <label className="block text-sm">
        Password minimum length
        <input
          type="number"
          className="mt-1 block h-10 w-32 rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.passwordMinLength ?? 8}
          onChange={(e) => setForm((prev) => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.cspEnabled ?? false}
          onChange={(e) => setForm((prev) => ({ ...prev, cspEnabled: e.target.checked }))}
        />
        Enable Content-Security-Policy
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.cspReportOnly ?? true}
          onChange={(e) => setForm((prev) => ({ ...prev, cspReportOnly: e.target.checked }))}
        />
        CSP report-only mode
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.apiKeyRequired ?? false}
          onChange={(e) => setForm((prev) => ({ ...prev, apiKeyRequired: e.target.checked }))}
        />
        Require API key for public write endpoints
      </label>
      <label className="block text-sm">
        CORS origins (one per line)
        <textarea
          className="mt-1 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs"
          rows={4}
          value={corsOrigins}
          onChange={(e) => setCorsOrigins(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Allowed origins (one per line)
        <textarea
          className="mt-1 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs"
          rows={4}
          value={allowedOrigins}
          onChange={(e) => setAllowedOrigins(e.target.value)}
        />
      </label>
      <Button type="button" onClick={() => void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))}>
        Save security settings
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
