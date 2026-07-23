'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

const REPORTS = [
  'overview',
  'content',
  'search',
  'ads',
  'affiliates',
  'directory',
  'ai-tools',
  'calculators',
  'users',
  'system',
] as const;

export function AnalyticsExportForm() {
  const [report, setReport] = useState<(typeof REPORTS)[number]>('overview');
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [message, setMessage] = useState<string | null>(null);

  async function exportReport() {
    setMessage(null);
    try {
      const qs = new URLSearchParams({ report, format, period: 'month' });
      const res = await fetch(`/api/admin/analytics/export?${qs}`);
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(json.error?.message || 'Export failed');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      const filenameMatch = cd?.match(/filename="([^"]+)"/);
      const ext = format === 'excel' ? 'csv' : format;
      const filename = filenameMatch?.[1] || `analytics-${report}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Download started.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <label className="text-sm">
        Report
        <select
          className="mt-1 block h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          value={report}
          onChange={(e) => setReport(e.target.value as (typeof REPORTS)[number])}
        >
          {REPORTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Format
        <select
          className="mt-1 block h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          value={format}
          onChange={(e) => setFormat(e.target.value as 'csv' | 'excel' | 'pdf')}
        >
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="pdf">PDF</option>
        </select>
      </label>
      <Button type="button" onClick={() => void exportReport()}>
        Export
      </Button>
      {message ? <p className="w-full text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
