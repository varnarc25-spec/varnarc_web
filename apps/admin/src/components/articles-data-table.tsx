'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

export type ArticleTableRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  categoryName: string;
  subcategoryName: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ArticlesDataTable({ rows }: { rows: ArticleTableRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<ColumnDef<ArticleTableRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div>
            <Link
              href={`/articles/${row.original.id}`}
              className="font-medium text-[var(--varnarc-brand)] hover:underline"
            >
              {row.original.title}
            </Link>
            <div className="text-xs text-[var(--varnarc-subtle)]">/{row.original.slug}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <span className="rounded-full bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs font-medium">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
      },
      {
        accessorKey: 'subcategoryName',
        header: 'Subcategory',
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => (
          <span className="text-[var(--varnarc-subtle)]">
            {new Date(String(getValue())).toLocaleString()}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!rows.length) {
    return (
      <p className="rounded-lg border border-[var(--varnarc-border)] px-4 py-8 text-center text-sm text-[var(--varnarc-subtle)]">
        No articles yet.
      </p>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, rows.length);

  return (
    <div className="space-y-3">
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
          Showing {from}–{to} of {rows.length}
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
            Page {pageIndex + 1} of {pageCount}
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
