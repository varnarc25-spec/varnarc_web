'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export type ContactSettings = {
  emailEnabled?: boolean;
  fromEmail?: string | null;
  toGeneral?: string | null;
  toEditorial?: string | null;
  toBusiness?: string | null;
  toSupport?: string | null;
  toPrivacy?: string | null;
  publicContactEmail?: string | null;
  resendApiKeyConfigured?: boolean;
  envApiKeyConfigured?: boolean;
};

export function ContactSettingsForm({ initial }: { initial: ContactSettings }) {
  const [form, setForm] = useState({
    emailEnabled: initial.emailEnabled !== false,
    fromEmail: initial.fromEmail ?? '',
    toGeneral: initial.toGeneral ?? '',
    toEditorial: initial.toEditorial ?? '',
    toBusiness: initial.toBusiness ?? '',
    toSupport: initial.toSupport ?? '',
    toPrivacy: initial.toPrivacy ?? '',
    publicContactEmail: initial.publicContactEmail ?? '',
    resendApiKey: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        emailEnabled: form.emailEnabled,
        fromEmail: form.fromEmail || null,
        toGeneral: form.toGeneral || null,
        toEditorial: form.toEditorial || null,
        toBusiness: form.toBusiness || null,
        toSupport: form.toSupport || null,
        toPrivacy: form.toPrivacy || null,
        publicContactEmail: form.publicContactEmail || null,
      };
      if (form.resendApiKey.trim()) {
        body.resendApiKey = form.resendApiKey.trim();
      }
      const res = await fetch('/api/admin/settings/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setForm((prev) => ({ ...prev, resendApiKey: '' }));
      setMessage('Contact email settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3';

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <p className="text-sm text-[var(--varnarc-subtle)]">
        Configure where contact form enquiries are delivered. Messages are always stored in the
        database first, then emailed when delivery is enabled and configured.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.emailEnabled}
          onChange={(e) => update('emailEnabled', e.target.checked)}
        />
        Send email after storing the enquiry
      </label>

      <div className="rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] px-3 py-2 text-sm text-[var(--varnarc-subtle)]">
        Resend API key:{' '}
        {initial.envApiKeyConfigured
          ? 'configured via environment (preferred)'
          : initial.resendApiKeyConfigured
            ? 'configured in admin settings'
            : 'not configured'}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          From email
          <input
            className={inputClass}
            placeholder="Varnarc &lt;noreply@yourdomain.com&gt;"
            value={form.fromEmail}
            onChange={(e) => update('fromEmail', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          General enquiries
          <input
            type="email"
            className={inputClass}
            value={form.toGeneral}
            onChange={(e) => update('toGeneral', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Content corrections (editorial)
          <input
            type="email"
            className={inputClass}
            value={form.toEditorial}
            onChange={(e) => update('toEditorial', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Business &amp; partnerships
          <input
            type="email"
            className={inputClass}
            value={form.toBusiness}
            onChange={(e) => update('toBusiness', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Technical support
          <input
            type="email"
            className={inputClass}
            value={form.toSupport}
            onChange={(e) => update('toSupport', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Privacy requests
          <input
            type="email"
            className={inputClass}
            value={form.toPrivacy}
            onChange={(e) => update('toPrivacy', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Public contact email (optional display)
          <input
            type="email"
            className={inputClass}
            value={form.publicContactEmail}
            onChange={(e) => update('publicContactEmail', e.target.value)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          Resend API key (leave blank to keep existing)
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder={
              initial.resendApiKeyConfigured || initial.envApiKeyConfigured ? '••••••••' : 're_...'
            }
            value={form.resendApiKey}
            onChange={(e) => update('resendApiKey', e.target.value)}
          />
          <span className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
            Prefer setting <code>RESEND_API_KEY</code> in environment for production. Admin-stored
            keys are a fallback.
          </span>
        </label>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save contact settings'}
      </Button>
    </div>
  );
}
