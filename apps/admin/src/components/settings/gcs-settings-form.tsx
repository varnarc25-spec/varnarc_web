'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export type GcsSettingsView = {
  enabled?: boolean;
  bucket?: string | null;
  projectId?: string | null;
  clientEmail?: string | null;
  publicBaseUrl?: string | null;
  makePublic?: boolean;
  privateKeyConfigured?: boolean;
  envBucketConfigured?: boolean;
  activeSource?: 'database' | 'environment' | 'none';
};

export function GcsSettingsForm({ initial }: { initial: GcsSettingsView }) {
  const [form, setForm] = useState({
    enabled: Boolean(initial.enabled),
    bucket: initial.bucket ?? '',
    projectId: initial.projectId ?? '',
    clientEmail: initial.clientEmail ?? '',
    privateKey: '',
    publicBaseUrl: initial.publicBaseUrl ?? '',
    makePublic: Boolean(initial.makePublic),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/gcs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: form.enabled,
          bucket: form.bucket.trim() || null,
          projectId: form.projectId.trim() || null,
          clientEmail: form.clientEmail.trim() || null,
          privateKey: form.privateKey.trim() ? form.privateKey : '',
          publicBaseUrl: form.publicBaseUrl.trim() || null,
          makePublic: form.makePublic,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string; details?: unknown };
      };
      if (!res.ok) {
        throw new Error(json.error?.message || `Save failed (${res.status})`);
      }
      setForm((prev) => ({ ...prev, privateKey: '' }));
      setMessage(
        'Cloud Storage settings saved. New media uploads will use this configuration immediately.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3';
  const sourceLabel =
    initial.activeSource === 'database'
      ? 'Database (this page)'
      : initial.activeSource === 'environment'
        ? 'Environment variables'
        : 'Not configured (files stored in the API database)';

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <p className="text-sm text-[var(--varnarc-subtle)]">
        Used for media library uploads, construction documents, and invoice files. Leave disabled to
        keep files in the application database and serve them at{' '}
        <code className="text-xs">/api/v1/media/public/…</code>.
      </p>
      <p className="text-sm">
        Active source: <strong>{sourceLabel}</strong>
        {initial.envBucketConfigured ? ' (GCS_BUCKET is also set in the environment.)' : null}
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
        />
        Use Google Cloud Storage for uploads
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Bucket name
          <input
            className={inputClass}
            placeholder="varnarc-media"
            value={form.bucket}
            onChange={(e) => setForm((prev) => ({ ...prev, bucket: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          GCP project ID
          <input
            className={inputClass}
            placeholder="my-gcp-project"
            value={form.projectId}
            onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          Service account email
          <input
            className={inputClass}
            placeholder="media-uploader@project.iam.gserviceaccount.com"
            value={form.clientEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, clientEmail: e.target.value }))}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          Service account private key
          <textarea
            className="mt-1 min-h-28 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs"
            placeholder={
              initial.privateKeyConfigured
                ? 'A key is already stored. Paste a new PEM only to replace it.'
                : '-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----'
            }
            value={form.privateKey}
            onChange={(e) => setForm((prev) => ({ ...prev, privateKey: e.target.value }))}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          Public / CDN base URL (optional)
          <input
            className={inputClass}
            placeholder="https://storage.googleapis.com/varnarc-media"
            value={form.publicBaseUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, publicBaseUrl: e.target.value }))}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.makePublic}
          onChange={(e) => setForm((prev) => ({ ...prev, makePublic: e.target.checked }))}
        />
        Make uploaded objects publicly readable
      </label>

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save Cloud Storage settings'}
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
