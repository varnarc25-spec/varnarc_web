'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type EmailProviderOption = 'resend' | 'google-workspace' | 'smtp';

export type ContactSettings = {
  emailEnabled?: boolean;
  emailProvider?: 'resend' | 'smtp';
  fromEmail?: string | null;
  toGeneral?: string | null;
  toEditorial?: string | null;
  toBusiness?: string | null;
  toSupport?: string | null;
  toPrivacy?: string | null;
  publicContactEmail?: string | null;
  resendApiKeyConfigured?: boolean;
  envApiKeyConfigured?: boolean;
  smtpHost?: string | null;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string | null;
  smtpPasswordConfigured?: boolean;
};

export function ContactSettingsForm({
  initial,
  mode = 'contact',
}: {
  initial: ContactSettings;
  mode?: 'contact' | 'ai-alerts';
}) {
  const initialProvider: EmailProviderOption =
    initial.emailProvider === 'smtp' && initial.smtpHost === 'smtp.gmail.com'
      ? 'google-workspace'
      : (initial.emailProvider ?? 'resend');
  const [form, setForm] = useState({
    emailEnabled: initial.emailEnabled !== false,
    emailProvider: initialProvider,
    fromEmail: initial.fromEmail ?? '',
    toGeneral: initial.toGeneral ?? '',
    toEditorial: initial.toEditorial ?? '',
    toBusiness: initial.toBusiness ?? '',
    toSupport: initial.toSupport ?? '',
    toPrivacy: initial.toPrivacy ?? '',
    publicContactEmail: initial.publicContactEmail ?? '',
    resendApiKey: '',
    smtpHost: initial.smtpHost ?? '',
    smtpPort: initial.smtpPort ?? 587,
    smtpSecure: initial.smtpSecure ?? false,
    smtpUsername: initial.smtpUsername ?? '',
    smtpPassword: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function changeProvider(provider: EmailProviderOption) {
    setForm((prev) => ({
      ...prev,
      emailProvider: provider,
      ...(provider === 'google-workspace'
        ? {
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpSecure: false,
            fromEmail:
              prev.fromEmail ||
              (prev.smtpUsername ? `Varnarc <${prev.smtpUsername}>` : prev.fromEmail),
          }
        : {}),
    }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        emailEnabled: form.emailEnabled,
        emailProvider: form.emailProvider === 'resend' ? 'resend' : 'smtp',
        fromEmail: form.fromEmail || null,
        toGeneral: form.toGeneral || null,
        toEditorial: form.toEditorial || null,
        toBusiness: form.toBusiness || null,
        toSupport: form.toSupport || null,
        toPrivacy: form.toPrivacy || null,
        publicContactEmail: form.publicContactEmail || null,
        smtpHost: form.smtpHost || null,
        smtpPort: form.smtpPort,
        smtpSecure: form.smtpSecure,
        smtpUsername: form.smtpUsername || null,
      };
      if (form.resendApiKey.trim()) {
        body.resendApiKey = form.resendApiKey.trim();
      }
      if (form.smtpPassword.trim()) {
        body.smtpPassword = form.smtpPassword.trim();
      }
      const res = await fetch('/api/admin/settings/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setForm((prev) => ({ ...prev, resendApiKey: '', smtpPassword: '' }));
      setMessage(
        mode === 'ai-alerts' ? 'AI alert email settings saved.' : 'Contact email settings saved.',
      );
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
        {mode === 'ai-alerts'
          ? 'Configure email delivery for AI provider failure alerts. Alerts are deduplicated for one hour.'
          : 'Configure where contact form enquiries are delivered. Messages are always stored in the database first, then emailed when delivery is enabled and configured.'}
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.emailEnabled}
          onChange={(e) => update('emailEnabled', e.target.checked)}
        />
        {mode === 'ai-alerts'
          ? 'Enable operational email delivery'
          : 'Send email after storing the enquiry'}
      </label>

      <label className="block text-sm">
        Email provider
        <select
          className={inputClass}
          value={form.emailProvider}
          onChange={(e) => changeProvider(e.target.value as EmailProviderOption)}
        >
          <option value="resend">Resend</option>
          <option value="google-workspace">Google Workspace (Gmail SMTP)</option>
          <option value="smtp">Custom SMTP server</option>
        </select>
      </label>

      <div className="rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] px-3 py-2 text-sm text-[var(--varnarc-subtle)]">
        {form.emailProvider !== 'resend' ? (
          <>SMTP password: {initial.smtpPasswordConfigured ? 'configured' : 'not configured'}</>
        ) : (
          <>
            Resend API key:{' '}
            {initial.envApiKeyConfigured
              ? 'configured via environment (preferred)'
              : initial.resendApiKeyConfigured
                ? 'configured in admin settings'
                : 'not configured'}
          </>
        )}
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
        {mode === 'contact' ? (
          <label className="block text-sm">
            General enquiries
            <input
              type="email"
              className={inputClass}
              value={form.toGeneral}
              onChange={(e) => update('toGeneral', e.target.value)}
            />
          </label>
        ) : null}
        {mode === 'contact' ? (
          <label className="block text-sm">
            Content corrections (editorial)
            <input
              type="email"
              className={inputClass}
              value={form.toEditorial}
              onChange={(e) => update('toEditorial', e.target.value)}
            />
          </label>
        ) : null}
        <label className="block text-sm">
          {mode === 'ai-alerts' ? 'AI failure alert recipient' : 'Business & partnerships'}
          <input
            type="email"
            className={inputClass}
            value={form.toBusiness}
            placeholder={mode === 'ai-alerts' ? 'business@varnarc.com' : undefined}
            onChange={(e) => update('toBusiness', e.target.value)}
          />
        </label>
        {mode === 'contact' ? (
          <>
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
          </>
        ) : null}
        {form.emailProvider === 'resend' ? (
          <label className="block text-sm md:col-span-2">
            Resend API key (leave blank to keep existing)
            <input
              type="password"
              autoComplete="new-password"
              className={inputClass}
              placeholder={
                initial.resendApiKeyConfigured || initial.envApiKeyConfigured
                  ? '••••••••'
                  : 're_...'
              }
              value={form.resendApiKey}
              onChange={(e) => update('resendApiKey', e.target.value)}
            />
            <span className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
              Prefer setting <code>RESEND_API_KEY</code> in environment for production. Admin-stored
              keys are a fallback.
            </span>
          </label>
        ) : (
          <>
            {form.emailProvider === 'google-workspace' ? (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 md:col-span-2">
                <p className="font-medium">Google Workspace setup</p>
                <p className="mt-1">
                  Use your full Workspace email and a 16-character Google App Password. Your normal
                  Google password will not work.
                </p>
                <a
                  className="mt-2 inline-block font-medium underline"
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                >
                  Create a Google App Password
                </a>
              </div>
            ) : null}
            <label className="block text-sm">
              {form.emailProvider === 'google-workspace' ? 'Gmail SMTP host' : 'SMTP host'}
              <input
                className={inputClass}
                placeholder="smtp.example.com"
                value={form.smtpHost}
                onChange={(e) => update('smtpHost', e.target.value)}
                readOnly={form.emailProvider === 'google-workspace'}
              />
            </label>
            <label className="block text-sm">
              SMTP port
              <input
                type="number"
                min={1}
                max={65535}
                className={inputClass}
                value={form.smtpPort}
                onChange={(e) => update('smtpPort', Number(e.target.value))}
                readOnly={form.emailProvider === 'google-workspace'}
              />
            </label>
            <label className="block text-sm">
              {form.emailProvider === 'google-workspace'
                ? 'Google Workspace email'
                : 'SMTP username'}
              <input
                type={form.emailProvider === 'google-workspace' ? 'email' : 'text'}
                className={inputClass}
                autoComplete="username"
                placeholder={
                  form.emailProvider === 'google-workspace' ? 'business@varnarc.com' : undefined
                }
                value={form.smtpUsername}
                onChange={(e) => update('smtpUsername', e.target.value)}
              />
            </label>
            <label className="block text-sm">
              {form.emailProvider === 'google-workspace'
                ? 'Google App Password (leave blank to keep existing)'
                : 'SMTP password (leave blank to keep existing)'}
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder={initial.smtpPasswordConfigured ? '••••••••' : undefined}
                value={form.smtpPassword}
                onChange={(e) => update('smtpPassword', e.target.value)}
              />
            </label>
            <label
              className={`flex items-center gap-2 text-sm md:col-span-2 ${
                form.emailProvider === 'google-workspace' ? 'hidden' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={form.smtpSecure}
                onChange={(e) => update('smtpSecure', e.target.checked)}
              />
              Use implicit TLS (normally enabled for port 465; leave off for STARTTLS on port 587)
            </label>
          </>
        )}
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving
          ? 'Saving…'
          : mode === 'ai-alerts'
            ? 'Save alert email settings'
            : 'Save contact settings'}
      </Button>
    </div>
  );
}
