'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full max-w-xs rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

type FeatureRow = { name: string; toolCount: number };

export function AiFeatureManager({ initial }: { initial: FeatureRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function rename() {
    if (!fromName || !toName) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai-tools/features/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromName, toName }),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        data?: { renamed?: number; skipped?: number };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Rename failed');
      setMessage(`Renamed ${json.data?.renamed ?? 0} (skipped ${json.data?.skipped ?? 0})`);
      setFromName('');
      setToName('');
      router.refresh();
      const list = await fetch('/api/admin/ai-tools/features').then((r) => r.json());
      if (Array.isArray(list.data)) setRows(list.data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setLoading(false);
    }
  }

  async function remove(name: string) {
    if (!confirm(`Remove feature "${name}" from all tools?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-tools/features?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Delete failed');
      setRows((prev) => prev.filter((r) => r.name !== name));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--varnarc-subtle)]">From</label>
          <input className={inputClass} value={fromName} onChange={(e) => setFromName(e.target.value)} list="feature-names" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--varnarc-subtle)]">To</label>
          <input className={inputClass} value={toName} onChange={(e) => setToName(e.target.value)} />
        </div>
        <Button type="button" disabled={loading || !fromName || !toName} onClick={() => void rename()}>
          {loading ? 'Working…' : 'Rename feature'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>

      <datalist id="feature-names">
        {rows.map((r) => (
          <option key={r.name} value={r.name} />
        ))}
      </datalist>

      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 font-medium">Tools</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.toolCount}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm text-[var(--varnarc-brand)] hover:underline"
                    onClick={() => {
                      setFromName(row.name);
                      setToName('');
                    }}
                  >
                    Use in rename
                  </button>
                  {' · '}
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    disabled={loading}
                    onClick={() => void remove(row.name)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No features yet. Add features on individual tool edit pages.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
