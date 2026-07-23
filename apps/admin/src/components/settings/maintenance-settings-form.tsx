'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type MaintenanceSettings = {
  enabled?: boolean;
  message?: string | null;
  readOnly?: boolean;
  scheduledFrom?: string | null;
  scheduledUntil?: string | null;
  allowedIps?: string[];
  bypassRoles?: string[];
};

export function MaintenanceSettingsForm({ initial }: { initial: MaintenanceSettings }) {
  const [form, setForm] = useState<MaintenanceSettings>(initial);
  const [allowedIps, setAllowedIps] = useState((initial.allowedIps ?? []).join('\n'));
  const [bypassRoles, setBypassRoles] = useState((initial.bypassRoles ?? []).join('\n'));
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const body = {
      ...form,
      allowedIps: allowedIps.split('\n').map((s) => s.trim()).filter(Boolean),
      bypassRoles: bypassRoles.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch('/api/admin/settings/maintenance', {
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
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled ?? false}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
        />
        Maintenance mode enabled
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.readOnly ?? false}
          onChange={(e) => setForm((prev) => ({ ...prev, readOnly: e.target.checked }))}
        />
        Read-only mode (allow viewing, block writes)
      </label>
      <label className="block text-sm">
        Maintenance message
        <textarea
          className="mt-1 w-full max-w-2xl rounded-md border border-[var(--varnarc-border)] p-3 text-sm"
          rows={3}
          value={form.message ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value || null }))}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Scheduled from (ISO datetime)
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3 font-mono text-xs"
            value={form.scheduledFrom ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduledFrom: e.target.value || null }))}
            placeholder="2026-07-22T00:00:00.000Z"
          />
        </label>
        <label className="block text-sm">
          Scheduled until (ISO datetime)
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3 font-mono text-xs"
            value={form.scheduledUntil ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduledUntil: e.target.value || null }))}
            placeholder="2026-07-22T04:00:00.000Z"
          />
        </label>
      </div>
      <label className="block text-sm">
        Allowed IPs (one per line, bypass maintenance)
        <textarea
          className="mt-1 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs"
          rows={3}
          value={allowedIps}
          onChange={(e) => setAllowedIps(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Bypass roles (one per line)
        <textarea
          className="mt-1 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs"
          rows={2}
          value={bypassRoles}
          onChange={(e) => setBypassRoles(e.target.value)}
        />
      </label>
      <Button type="button" onClick={() => void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))}>
        Save maintenance settings
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
