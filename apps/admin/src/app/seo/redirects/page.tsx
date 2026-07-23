'use client';

import { useEffect, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type Redirect = {
  id: string;
  sourcePath: string;
  targetPath: string;
  redirectType: number;
  status: string;
  hitCount: number;
};

export default function SeoRedirectsPage() {
  const [items, setItems] = useState<Redirect[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [importCsv, setImportCsv] = useState('');

  async function load() {
    const res = await fetch('/api/admin/seo/redirects');
    const json = (await res.json()) as { data?: Redirect[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRedirect() {
    setMessage(null);
    const res = await fetch('/api/admin/seo/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath, targetPath, redirectType: 301, status: 'ACTIVE' }),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Failed to create redirect');
      return;
    }
    setSourcePath('');
    setTargetPath('');
    setMessage('Redirect created.');
    await load();
  }

  async function importRedirects() {
    setMessage(null);
    const lines = importCsv
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const redirects = lines.map((line) => {
      const [source, target, type] = line.split(',').map((s) => s.trim());
      return {
        sourcePath: source,
        targetPath: target,
        redirectType: type ? Number(type) : 301,
        status: 'ACTIVE' as const,
      };
    });
    const res = await fetch('/api/admin/seo/redirects/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirects }),
    });
    const json = (await res.json()) as { error?: { message?: string }; data?: { imported?: number } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Import failed');
      return;
    }
    setImportCsv('');
    setMessage(`Imported ${json.data?.imported ?? redirects.length} redirects.`);
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/seo/redirects/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="SEO Redirects" description="Manage 301/302 redirects." />
      <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] p-4 md:grid-cols-3">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          placeholder="/old-path"
          value={sourcePath}
          onChange={(e) => setSourcePath(e.target.value)}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          placeholder="/new-path or https://..."
          value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
        />
        <Button type="button" onClick={() => void createRedirect()}>
          Add redirect
        </Button>
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      <div className="space-y-2 rounded-lg border border-[var(--varnarc-border)] p-4">
        <p className="text-sm font-medium">Bulk import (CSV: source,target,type)</p>
        <textarea
          className="w-full rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs"
          rows={5}
          placeholder="/old-path,/new-path,301"
          value={importCsv}
          onChange={(e) => setImportCsv(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => void importRedirects()}>
          Import redirects
        </Button>
      </div>
      <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Target</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Hits</th>
              <th className="px-3 py-2 text-left" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-3 py-2 font-mono">{r.sourcePath}</td>
                <td className="px-3 py-2 font-mono">{r.targetPath}</td>
                <td className="px-3 py-2">{r.redirectType}</td>
                <td className="px-3 py-2">{r.hitCount}</td>
                <td className="px-3 py-2">
                  <button type="button" className="text-red-600" onClick={() => void remove(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
