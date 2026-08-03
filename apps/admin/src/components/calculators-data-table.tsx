'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

export type CalculatorTableRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  categoryName: string;
  fieldCount: number;
  runCount: number;
  publicUrl: string;
  health?: 'ok' | 'fail' | 'skip' | 'pending';
  healthMessage?: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function statusBadge(status: string) {
  const tone =
    status === 'PUBLISHED'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'DRAFT'
        ? 'bg-amber-100 text-amber-900'
        : 'bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

function healthBadge(health?: CalculatorTableRow['health'], message?: string) {
  if (!health || health === 'pending') {
    return <span className="text-xs text-[var(--varnarc-subtle)]">—</span>;
  }
  if (health === 'ok' || health === 'skip') {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        {health === 'skip' ? 'Skipped' : 'OK'}
      </span>
    );
  }
  return (
    <span
      className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
      title={message}
    >
      Failed
    </span>
  );
}

export function CalculatorsDataTable({ rows }: { rows: CalculatorTableRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<CalculatorTableRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <Link
              href={`/calculators/${row.original.id}`}
              className="font-medium text-[var(--varnarc-brand)] hover:underline"
            >
              {row.original.name}
            </Link>
            <div className="font-mono text-xs text-[var(--varnarc-subtle)]">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => statusBadge(String(getValue())),
      },
      {
        accessorKey: 'fieldCount',
        header: 'Fields',
      },
      {
        accessorKey: 'runCount',
        header: 'Runs',
      },
      {
        id: 'health',
        accessorKey: 'health',
        header: 'Health',
        cell: ({ row }) => healthBadge(row.original.health, row.original.healthMessage),
      },
      {
        id: 'public',
        header: 'Public',
        cell: ({ row }) => (
          <a
            href={row.original.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--varnarc-brand)] hover:underline"
          >
            View
          </a>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, globalFilter },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase().trim();
      if (!q) return true;
      const { name, slug, categoryName, status } = row.original;
      return [name, slug, categoryName, status].some((part) => part.toLowerCase().includes(q));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!rows.length) {
    return (
      <p className="rounded-lg border border-[var(--varnarc-border)] px-4 py-8 text-center text-sm text-[var(--varnarc-subtle)]">
        No calculators yet.
      </p>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const from = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div className="space-y-3">
      <input
        value={globalFilter}
        onChange={(e) => {
          setGlobalFilter(e.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        placeholder="Search calculators…"
        className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-[var(--varnarc-ink)]"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--varnarc-subtle)]">
        <span>
          Showing {from}–{to} of {filteredCount}
          {filteredCount !== rows.length ? ` (filtered from ${rows.length})` : ''}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            Rows
            <select
              className="h-8 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPagination({ pageIndex: 0, pageSize: next });
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="h-8 rounded-md border border-[var(--varnarc-border)] px-3 disabled:opacity-40"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span>
            Page {pageIndex + 1} of {pageCount || 1}
          </span>
          <button
            type="button"
            className="h-8 rounded-md border border-[var(--varnarc-border)] px-3 disabled:opacity-40"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
