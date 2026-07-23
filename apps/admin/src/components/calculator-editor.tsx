'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { CalculatorAiPanel } from '@/components/calculator-ai-panel';

type FieldDraft = {
  key: string;
  label: string;
  fieldType: string;
  defaultValue: string;
  sortOrder: number;
  required: boolean;
};

type Category = { id: string; name: string; slug: string };
type VersionRow = { id: string; version: number; createdAt: string; formula?: string | null };

const defaultResultTemplate = {
  cards: [{ key: 'result', label: 'Result', format: 'number' }],
  table: { title: 'Details', rows: [{ label: 'Result', key: 'result', format: 'number' }] },
  chart: { title: 'Chart', keys: ['result'], labels: { result: 'Result' } },
  breakdown: { title: 'Breakdown', items: [{ label: 'Result', key: 'result', format: 'number' }] },
  recommendations: true,
};

export function CalculatorEditor({
  initial,
  categories,
  versions = [],
}: {
  initial?: {
    id?: string;
    name: string;
    slug: string;
    description?: string | null;
    categoryId?: string | null;
    formula?: string | null;
    status?: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    resultTemplate?: unknown;
    settings?: unknown;
    fields?: Array<{
      key: string;
      label: string;
      fieldType: string;
      defaultValue?: string | null;
      sortOrder: number;
      required: boolean;
    }>;
  };
  categories: Category[];
  versions?: VersionRow[];
}) {
  const router = useRouter();
  const isNew = !initial?.id;
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || '');
  const [formula, setFormula] = useState(
    initial?.formula ||
      JSON.stringify({ type: 'static', outputs: { result: 'a + b' } }, null, 2),
  );
  const [resultTemplate, setResultTemplate] = useState(
    JSON.stringify(initial?.resultTemplate ?? defaultResultTemplate, null, 2),
  );
  const [settings, setSettings] = useState(
    JSON.stringify(
      initial?.settings ?? {
        mode: 'form',
        faq: [{ q: 'How does this work?', a: 'Enter values and calculate.' }],
      },
      null,
      2,
    ),
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription || '');
  const [fields, setFields] = useState<FieldDraft[]>(
    initial?.fields?.map((f) => ({
      key: f.key,
      label: f.label,
      fieldType: f.fieldType,
      defaultValue: f.defaultValue || '',
      sortOrder: f.sortOrder,
      required: f.required,
    })) || [
      { key: 'a', label: 'A', fieldType: 'number', defaultValue: '1', sortOrder: 0, required: true },
      { key: 'b', label: 'B', fieldType: 'number', defaultValue: '1', sortOrder: 1, required: true },
    ],
  );
  const [previewInputs, setPreviewInputs] = useState('{"a":10,"b":5}');
  const [previewOut, setPreviewOut] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parseJsonField(label: string, raw: string) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      throw new Error(`Invalid JSON in ${label}`);
    }
  }

  async function save(publish = false) {
    setLoading(true);
    setMessage(null);
    try {
      const body = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: description || null,
        categoryId: categoryId || null,
        formula,
        resultTemplate: parseJsonField('result template', resultTemplate),
        settings: parseJsonField('settings', settings),
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        fields: fields.map((f, i) => ({
          ...f,
          defaultValue: f.defaultValue || null,
          sortOrder: i,
        })),
      };

      const res = await fetch(isNew ? '/api/admin/calculators' : `/api/admin/calculators/${initial!.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { data?: { id: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');

      const id = json.data?.id || initial?.id;
      if (publish && id) {
        const pub = await fetch(`/api/admin/calculators/${id}/publish`, { method: 'POST' });
        if (!pub.ok) {
          const pj = (await pub.json()) as { error?: { message?: string } };
          throw new Error(pj.error?.message || 'Publish failed');
        }
      }

      setMessage(publish ? 'Saved & published' : 'Saved');
      if (isNew && id) router.push(`/calculators/${id}`);
      else router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function cloneCalc() {
    if (!initial?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calculators/${initial.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { data?: { id: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Clone failed');
      if (json.data?.id) router.push(`/calculators/${json.data.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setLoading(false);
    }
  }

  async function runPreview() {
    if (!initial?.id) {
      setPreviewOut('Save the calculator first to preview.');
      return;
    }
    try {
      const inputs = parseJsonField('preview inputs', previewInputs) as Record<string, unknown>;
      const res = await fetch(`/api/admin/calculators/${initial.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      });
      const json = await res.json();
      setPreviewOut(JSON.stringify(json, null, 2));
    } catch (err) {
      setPreviewOut(err instanceof Error ? err.message : 'Preview failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Name</span>
          <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Slug</span>
          <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
      </div>

      <CalculatorAiPanel
        name={name}
        slug={slug}
        description={description}
        formula={formula}
        onApplyDescription={setDescription}
        onApplySeo={({ seoTitle: t, seoDescription: d }) => {
          setSeoTitle(t);
          setSeoDescription(d);
        }}
      />

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Description</span>
        <textarea className="min-h-20 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Category</span>
        <select className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Input fields</h3>
          <Button
            type="button"
            onClick={() =>
              setFields((prev) => [
                ...prev,
                {
                  key: `field${prev.length + 1}`,
                  label: `Field ${prev.length + 1}`,
                  fieldType: 'number',
                  defaultValue: '',
                  sortOrder: prev.length,
                  required: true,
                },
              ])
            }
          >
            Add field
          </Button>
        </div>
        <div className="space-y-3">
          {fields.map((f, idx) => (
            <div key={idx} className="grid gap-2 rounded-md border border-[var(--varnarc-border)] p-3 md:grid-cols-5">
              <input className="h-9 rounded border border-[var(--varnarc-border)] px-2 text-sm" placeholder="key" value={f.key} onChange={(e) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))} />
              <input className="h-9 rounded border border-[var(--varnarc-border)] px-2 text-sm" placeholder="label" value={f.label} onChange={(e) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))} />
              <select className="h-9 rounded border border-[var(--varnarc-border)] px-2 text-sm" value={f.fieldType} onChange={(e) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, fieldType: e.target.value } : x)))}>
                {['number', 'currency', 'percentage', 'slider', 'dropdown', 'radio', 'checkbox', 'date', 'month', 'year', 'text', 'hidden', 'computed'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input className="h-9 rounded border border-[var(--varnarc-border)] px-2 text-sm" placeholder="default" value={f.defaultValue} onChange={(e) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, defaultValue: e.target.value } : x)))} />
              <Button type="button" onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Formula JSON (static / rules / api)</span>
        <textarea className="min-h-40 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs" value={formula} onChange={(e) => setFormula(e.target.value)} />
        <span className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
          Supports if(cond,a,b), comparisons, ternary a&gt;b?x:y, rules[], and type:&quot;api&quot; with allowlisted hosts.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Result template JSON (cards / table / chart / breakdown)</span>
        <textarea className="min-h-32 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs" value={resultTemplate} onChange={(e) => setResultTemplate(e.target.value)} />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Settings JSON (wizard mode, FAQ)</span>
        <textarea className="min-h-28 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs" value={settings} onChange={(e) => setSettings(e.target.value)} />
        <span className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
          {`{"mode":"wizard","steps":[{"title":"Loan","fields":["principal","annualRate"]}],"faq":[{"q":"...","a":"..."}]}`}
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO title</span>
          <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO description</span>
          <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        </label>
      </div>

      {!isNew ? (
        <div className="rounded-lg border border-[var(--varnarc-border)] p-4">
          <h3 className="mb-2 text-sm font-semibold">Preview</h3>
          <textarea className="mb-2 min-h-16 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs" value={previewInputs} onChange={(e) => setPreviewInputs(e.target.value)} />
          <Button type="button" onClick={() => void runPreview()}>
            Run preview
          </Button>
          {previewOut ? (
            <pre className="mt-3 max-h-60 overflow-auto rounded bg-[var(--varnarc-muted)] p-3 text-xs">{previewOut}</pre>
          ) : null}
        </div>
      ) : null}

      {!isNew && versions.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Version history</h3>
          <ul className="space-y-1 text-sm text-[var(--varnarc-subtle)]">
            {versions.map((v) => (
              <li key={v.id}>
                v{v.version} · {new Date(v.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={loading || !name} onClick={() => void save(false)}>
          {loading ? 'Saving…' : 'Save draft'}
        </Button>
        <Button type="button" disabled={loading || !name} onClick={() => void save(true)}>
          Save & publish
        </Button>
        {!isNew ? (
          <Button type="button" disabled={loading} onClick={() => void cloneCalc()}>
            Clone
          </Button>
        ) : null}
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
