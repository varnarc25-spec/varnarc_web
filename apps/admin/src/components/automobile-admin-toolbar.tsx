'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AutomobileListSearch({
  defaultValue,
  status,
  fuelType,
  category,
  showVehicleFilters,
}: {
  defaultValue?: string;
  status?: string;
  fuelType?: string;
  category?: string;
  showVehicleFilters?: boolean;
}) {
  return (
    <form className="mb-6 flex flex-wrap items-end gap-3">
      <input
        name="search"
        defaultValue={defaultValue || ''}
        placeholder="Search…"
        className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
      />
      {showVehicleFilters ? (
        <>
          <select
            name="status"
            defaultValue={status || ''}
            className="h-10 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            name="fuelType"
            defaultValue={fuelType || ''}
            className="h-10 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
          >
            <option value="">All fuels</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="CNG">CNG</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <input
            name="category"
            defaultValue={category || ''}
            placeholder="Category"
            className="h-10 w-40 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
          />
        </>
      ) : null}
      <button
        type="submit"
        className="h-10 rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white"
      >
        Filter
      </button>
    </form>
  );
}

export function AutomobileCsvToolbar({ entity }: { entity: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function importCsv() {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/admin/automobile/import/${entity}`, {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Import failed');
      setMessage('Import completed');
      setFile(null);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <a
        href={`/api/admin/automobile/export/${entity}`}
        className="inline-flex h-10 items-center rounded-md border border-[var(--varnarc-border)] px-4 text-sm font-medium hover:bg-[var(--varnarc-muted)]"
      >
        Export CSV
      </a>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button type="button" variant="secondary" size="sm" disabled={!file || loading} onClick={() => void importCsv()}>
          {loading ? 'Importing…' : 'Import CSV'}
        </Button>
      </div>
      {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
    </div>
  );
}
