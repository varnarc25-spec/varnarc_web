'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';

export function ThemeImportForm() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function importTheme() {
    setLoading(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      const res = await fetch('/api/admin/themes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const json = (await res.json()) as { error?: { message?: string }; data?: { id: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Import failed');
      setMessage('Imported');
      setJsonText('');
      if (json.data?.id) router.push(`/themes/${json.data.id}`);
      else router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Import theme JSON</h3>
      <textarea
        className="min-h-28 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 font-mono text-xs"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='{"name":"My theme","colors":{...}}'
      />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={importTheme} disabled={loading || !jsonText.trim()}>
          {loading ? 'Importing…' : 'Import'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
