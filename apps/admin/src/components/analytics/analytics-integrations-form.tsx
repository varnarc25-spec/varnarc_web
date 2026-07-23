'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type Integrations = {
  googleAnalyticsId?: string | null;
  googleSearchConsole?: boolean;
  cloudflareAnalytics?: boolean;
  microsoftClarityId?: string | null;
  plausibleDomain?: string | null;
  openTelemetryEnabled?: boolean;
  prometheusEnabled?: boolean;
};

export function AnalyticsIntegrationsForm({ initial }: { initial: Integrations }) {
  const [form, setForm] = useState<Integrations>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/analytics/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setMessage('Saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <label className="block text-sm">
        Google Analytics ID
        <input
          className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.googleAnalyticsId ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, googleAnalyticsId: e.target.value || null }))}
        />
      </label>
      <label className="block text-sm">
        Microsoft Clarity ID
        <input
          className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.microsoftClarityId ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, microsoftClarityId: e.target.value || null }))}
        />
      </label>
      <label className="block text-sm">
        Plausible domain
        <input
          className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.plausibleDomain ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, plausibleDomain: e.target.value || null }))}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.googleSearchConsole}
          onChange={(e) => setForm((f) => ({ ...f, googleSearchConsole: e.target.checked }))}
        />
        Google Search Console
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.cloudflareAnalytics}
          onChange={(e) => setForm((f) => ({ ...f, cloudflareAnalytics: e.target.checked }))}
        />
        Cloudflare Analytics
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.openTelemetryEnabled}
          onChange={(e) => setForm((f) => ({ ...f, openTelemetryEnabled: e.target.checked }))}
        />
        OpenTelemetry
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!form.prometheusEnabled}
          onChange={(e) => setForm((f) => ({ ...f, prometheusEnabled: e.target.checked }))}
        />
        Prometheus
      </label>
      <Button type="button" disabled={loading} onClick={() => void save()}>
        Save
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
