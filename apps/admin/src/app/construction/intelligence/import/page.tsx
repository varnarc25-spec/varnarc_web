'use client';

import { useState } from 'react';
import { PageHeader } from '@varnarc/ui';

export default function IntelligenceImportPage() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function runImport() {
    const res = await fetch('/api/admin/construction/intelligence/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  return (
    <div>
      <PageHeader
        title="Import rates"
        description="Validate CSV before writing. Malformed rows never update live rates. Official prices require a named source."
      />
      <p className="mb-3 text-sm">
        <a
          className="text-[var(--varnarc-brand)] underline"
          href="/api/admin/construction/intelligence/import-template"
        >
          Download CSV template
        </a>
      </p>
      <label className="block text-sm font-medium" htmlFor="csv">
        CSV
      </label>
      <textarea
        id="csv"
        className="mt-1 min-h-48 w-full rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs"
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
      />
      <button
        type="button"
        className="mt-3 rounded-md bg-[var(--varnarc-brand)] px-4 py-2 text-sm text-white"
        onClick={() => void runImport()}
      >
        Validate import
      </button>
      {result ? (
        <pre className="mt-4 overflow-auto rounded-md bg-[var(--varnarc-muted)] p-3 text-xs">
          {result}
        </pre>
      ) : null}
    </div>
  );
}
