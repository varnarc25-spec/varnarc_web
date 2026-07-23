'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass = 'h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3 text-sm';
const textareaClass = 'w-full rounded-md border border-[var(--varnarc-border)] p-3 text-sm font-mono';

export function PromptTestConsole({
  prompts,
  models,
}: {
  prompts: Array<{ id: string; slug: string; name: string }>;
  models: Array<{ id: string; slug: string; name: string }>;
}) {
  const [promptSlug, setPromptSlug] = useState(prompts[0]?.slug ?? '');
  const [modelId, setModelId] = useState('');
  const [variablesJson, setVariablesJson] = useState('{\n  "topic": "Home loan EMI guide"\n}');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const variables = JSON.parse(variablesJson) as Record<string, unknown>;
      const res = await fetch('/api/admin/ai-ops/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptSlug,
          modelId: modelId || null,
          variables,
        }),
      });
      const json = (await res.json()) as { data?: { output?: { content?: string }; error?: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Run failed');
      const content = json.data?.output?.content ?? JSON.stringify(json.data, null, 2);
      setResult(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Prompt
        <select className={`${inputClass} mt-1`} value={promptSlug} onChange={(e) => setPromptSlug(e.target.value)}>
          {prompts.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name} ({p.slug})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Model override (optional)
        <select className={`${inputClass} mt-1`} value={modelId} onChange={(e) => setModelId(e.target.value)}>
          <option value="">Default from env</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.slug})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Variables (JSON)
        <textarea className={`${textareaClass} mt-1`} rows={8} value={variablesJson} onChange={(e) => setVariablesJson(e.target.value)} />
      </label>
      <Button type="button" disabled={loading || !promptSlug} onClick={() => void run()}>
        {loading ? 'Running…' : 'Run prompt'}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <pre className="max-h-96 overflow-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4 text-xs whitespace-pre-wrap">
          {result}
        </pre>
      ) : null}
    </div>
  );
}

export function CreateModelForm() {
  const [form, setForm] = useState({ slug: '', name: '', provider: 'openai' });
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const res = await fetch('/api/admin/ai-ops/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Failed');
      return;
    }
    setMessage('Model created.');
    window.location.reload();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <input className={inputClass} placeholder="slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
      <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <input className={inputClass} placeholder="Provider" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
      <Button type="button" className="sm:col-span-3 sm:w-fit" onClick={() => void save()}>
        Add model
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)] sm:col-span-3">{message}</p> : null}
    </div>
  );
}

export function CreatePromptForm({ models }: { models: Array<{ id: string; slug: string; name: string }> }) {
  const [form, setForm] = useState({
    slug: '',
    name: '',
    template: 'Hello {{name}}',
    modelId: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const res = await fetch('/api/admin/ai-ops/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        modelId: form.modelId || null,
      }),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Failed');
      return;
    }
    setMessage('Prompt created.');
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <select className={inputClass} value={form.modelId} onChange={(e) => setForm((f) => ({ ...f, modelId: e.target.value }))}>
        <option value="">No default model</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <textarea className={textareaClass} rows={6} value={form.template} onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))} />
      <Button type="button" onClick={() => void save()}>
        Add prompt
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}

export function RetryJobButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);

  async function retry() {
    setLoading(true);
    await fetch(`/api/admin/ai-ops/jobs/${jobId}/retry`, { method: 'POST' });
    window.location.reload();
  }

  return (
    <Button type="button" variant="ghost" disabled={loading} onClick={() => void retry()}>
      {loading ? '…' : 'Retry'}
    </Button>
  );
}
