'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function DirectoryListSearch({
  defaultSearch,
  defaultStatus,
}: {
  defaultSearch?: string;
  defaultStatus?: string;
}) {
  return (
    <form className="mb-4 flex flex-wrap gap-3">
      <input
        name="search"
        defaultValue={defaultSearch || ''}
        placeholder="Search listings…"
        className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
      />
      <select
        name="status"
        defaultValue={defaultStatus || ''}
        className="h-10 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
      >
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-10 items-center rounded-md border border-[var(--varnarc-border)] px-4 text-sm font-medium hover:bg-[var(--varnarc-muted)]"
      >
        Filter
      </button>
    </form>
  );
}

export function DirectoryCsvToolbar() {
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
      const res = await fetch('/api/admin/directory/import/listings', { method: 'POST', body: formData });
      const json = (await res.json()) as { error?: { message?: string }; data?: { imported?: number } };
      if (!res.ok) throw new Error(json.error?.message || 'Import failed');
      setMessage(`Imported ${json.data?.imported ?? 0} listings`);
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
        href="/api/admin/directory/export/listings"
        className="inline-flex h-10 items-center rounded-md border border-[var(--varnarc-border)] px-4 text-sm font-medium hover:bg-[var(--varnarc-muted)]"
      >
        Export CSV
      </a>
      <div className="flex flex-wrap items-center gap-2">
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <Button type="button" variant="secondary" size="sm" disabled={!file || loading} onClick={() => void importCsv()}>
          {loading ? 'Importing…' : 'Import CSV'}
        </Button>
      </div>
      {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
    </div>
  );
}
