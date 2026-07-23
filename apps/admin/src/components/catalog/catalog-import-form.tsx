'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { CATALOG_ENTITIES } from '@varnarc/validation';

export function CatalogImportForm() {
  const [vertical, setVertical] = useState<'finance' | 'construction' | 'automobile'>('finance');
  const [entity, setEntity] = useState(CATALOG_ENTITIES.finance[0] ?? 'loans');
  const [file, setFile] = useState<File | null>(null);
  const [batchSize, setBatchSize] = useState('500');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const entities = CATALOG_ENTITIES[vertical];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const qs = new URLSearchParams({
        vertical,
        entity,
        batchSize,
        reindex: 'true',
      });
      const res = await fetch(`/api/admin/catalog/import?${qs.toString()}`, {
        method: 'POST',
        body: form,
      });
      const json = (await res.json()) as {
        data?: { imported?: number; batches?: number };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'Import failed');
      setResult(`Imported ${json.data?.imported ?? 0} rows in ${json.data?.batches ?? 0} batch(es)`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-lg border border-[var(--varnarc-border)] p-4">
      <h3 className="text-sm font-semibold">Batched catalog import</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Vertical</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-2"
            value={vertical}
            onChange={(e) => {
              const v = e.target.value as typeof vertical;
              setVertical(v);
              setEntity(CATALOG_ENTITIES[v][0] ?? '');
            }}
          >
            <option value="finance">Finance</option>
            <option value="construction">Construction</option>
            <option value="automobile">Automobile</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Entity</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-2"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            {entities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Batch size</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-2"
            type="number"
            min={50}
            max={2000}
            value={batchSize}
            onChange={(e) => setBatchSize(e.target.value)}
          />
        </label>
      </div>
      <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button type="submit" disabled={!file || loading}>
        {loading ? 'Importing…' : 'Import CSV (batched)'}
      </Button>
      {result ? <p className="text-sm text-[var(--varnarc-subtle)]">{result}</p> : null}
    </form>
  );
}
