'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SavedRow = {
  id: string;
  name: string;
  createdAt: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown> | null;
  calculator?: { name: string; slug: string } | null;
};

export function SavedCalculationsList({ initial }: { initial: SavedRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  async function remove(id: string) {
    setMessage(null);
    const res = await fetch(`/api/calculators/results/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setMessage('Delete failed');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
        <p className="font-semibold text-[#0b1f3a]">No saved calculations</p>
        <p className="mt-2 text-sm text-slate-600">Run a calculator and save results to revisit later.</p>
        <Link
          href="/calculators"
          className="mt-4 inline-block rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white"
        >
          Open calculators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#0b1f3a]">{row.name}</h3>
              <p className="text-xs text-slate-500">
                {row.calculator?.name || 'Calculator'} · {new Date(row.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              {row.calculator?.slug ? (
                <Link
                  href={`/calculators/${row.calculator.slug}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                >
                  Recalculate
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void remove(row.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
          {row.outputs ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              {Object.entries(row.outputs).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-semibold">{String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ))}
    </div>
  );
}
