'use client';

import { useEffect, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type Providers = {
  emailProvider?: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  pushProvider?: string;
  queueEnabled?: boolean;
};

export default function NotificationProvidersPage() {
  const [form, setForm] = useState<Providers>({ emailProvider: 'none', pushProvider: 'none' });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/admin/notifications/providers')
      .then((r) => r.json())
      .then((json: { data?: Providers }) => {
        if (json.data) setForm(json.data);
      });
  }, []);

  async function save() {
    setMessage(null);
    const res = await fetch('/api/admin/notifications/providers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Save failed');
      return;
    }
    setMessage('Saved (delivery integration is stubbed until email queue is wired).');
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Notification providers" description="Email and push provider configuration (stubs)." />
      <div className="max-w-xl space-y-4 rounded-lg border border-[var(--varnarc-border)] p-4">
        <label className="block text-sm">
          Email provider
          <select className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" value={form.emailProvider ?? 'none'} onChange={(e) => setForm((f) => ({ ...f, emailProvider: e.target.value }))}>
            <option value="none">None</option>
            <option value="smtp">SMTP</option>
            <option value="sendgrid">SendGrid</option>
            <option value="ses">Amazon SES</option>
            <option value="resend">Resend</option>
          </select>
        </label>
        <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" placeholder="SMTP host" value={form.smtpHost ?? ''} onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value || null }))} />
        <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" placeholder="SMTP port" value={form.smtpPort ?? ''} onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value ? Number(e.target.value) : null }))} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.queueEnabled ?? false} onChange={(e) => setForm((f) => ({ ...f, queueEnabled: e.target.checked }))} />
          Enable async delivery queue (when Redis available)
        </label>
        <Button type="button" onClick={() => void save()}>Save</Button>
        {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      </div>
    </div>
  );
}
