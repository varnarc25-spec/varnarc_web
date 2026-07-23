'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AiToolActionButton, AiToolsBulkActions } from '@/components/ai-tools-forms';

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured?: boolean;
  sponsored?: boolean;
  pricingModel?: string;
  viewCount?: number;
  category?: { name: string } | null;
};

export function AiToolsAdminTable({ rows }: { rows: ToolRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected((prev) => (prev.length === allIds.length ? [] : allIds));
  }

  return (
    <div>
      <AiToolsBulkActions ids={selected} />
      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Pricing</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.category?.name ?? '—'}</td>
                <td className="px-4 py-3">{row.pricingModel ?? '—'}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  {[row.featured ? 'Featured' : null, row.sponsored ? 'Sponsored' : null]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </td>
                <td className="px-4 py-3">{row.viewCount ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/ai-tools/tools/${row.id}/edit`}
                      className="text-sm text-[var(--varnarc-brand)] hover:underline"
                    >
                      Edit
                    </Link>
                    {row.status !== 'PUBLISHED' ? (
                      <AiToolActionButton id={row.id} action="publish" label="Publish" />
                    ) : (
                      <AiToolActionButton id={row.id} action="unpublish" label="Unpublish" />
                    )}
                    {!row.featured ? (
                      <AiToolActionButton id={row.id} action="feature" label="Feature" />
                    ) : null}
                    {!row.sponsored ? (
                      <AiToolActionButton id={row.id} action="sponsor" label="Sponsor" />
                    ) : null}
                    <Link
                      href={`/ai-tools/tools/${row.id}/history`}
                      className="text-sm text-[var(--varnarc-brand)] hover:underline"
                    >
                      History
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No tools yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
