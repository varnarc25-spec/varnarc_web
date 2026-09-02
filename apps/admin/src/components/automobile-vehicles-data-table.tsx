'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';
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
import { AutomobileDuplicateButton, AutomobilePublishButton } from '@/components/automobile-forms';

export type VehicleTableRow = {
  id: string;
  name: string;
  status: string;
  model?: string | null;
  fuelType?: string | null;
  exShowroomPrice?: number | string | null;
  sourceName?: string | null;
  manufacturer?: { name: string } | null;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function priceNumber(value: number | string | null | undefined) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AutomobileVehiclesDataTable({ rows }: { rows: VehicleTableRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshPrices = useCallback(
    async (ids?: string[], missingOnly = true) => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch('/api/admin/automobile/vehicles/refresh-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: ids?.length ? ids : undefined,
            missingOnly: ids?.length ? false : missingOnly,
            limit: 10,
          }),
        });
        const json = (await res.json()) as {
          data?: { updated?: number; skipped?: number; message?: string };
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(json.error?.message || 'Price refresh failed');
        setMessage(
          `Updated ${json.data?.updated ?? 0}, skipped ${json.data?.skipped ?? 0}. ${json.data?.message ?? ''}`,
        );
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Price refresh failed');
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const columns = useMemo<ColumnDef<VehicleTableRow>[]>(
    () => [
      {
        id: 'select',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--varnarc-brand)]"
            aria-label={`Select ${row.original.name}`}
            checked={selected.has(row.original.id)}
            onChange={() => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(row.original.id)) next.delete(row.original.id);
                else next.add(row.original.id);
                return next;
              });
            }}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/automobile/vehicles/${row.original.id}`}
            className="font-medium text-[var(--varnarc-brand)] hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: 'manufacturer',
        accessorFn: (row) => row.manufacturer?.name ?? '',
        header: 'Manufacturer',
      },
      { accessorKey: 'model', header: 'Model', cell: ({ getValue }) => String(getValue() || '—') },
      {
        accessorKey: 'fuelType',
        header: 'Fuel',
        cell: ({ getValue }) => String(getValue() || '—'),
      },
      {
        id: 'price',
        accessorFn: (row) => priceNumber(row.exShowroomPrice) ?? -1,
        header: 'Price',
        cell: ({ row }) => {
          const n = priceNumber(row.original.exShowroomPrice);
          return n == null ? '—' : `₹${n.toLocaleString('en-IN')}`;
        },
      },
      { accessorKey: 'status', header: 'Status' },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/automobile/vehicles/${row.original.id}`}
              className="text-sm text-[var(--varnarc-brand)] hover:underline"
            >
              Edit
            </Link>
            <AutomobilePublishButton
              entity="vehicles"
              id={row.original.id}
              status={row.original.status}
            />
            <AutomobileDuplicateButton id={row.original.id} />
            <button
              type="button"
              className="text-sm text-[var(--varnarc-brand)] hover:underline disabled:opacity-40"
              disabled={loading}
              onClick={() => void refreshPrices([row.original.id], false)}
            >
              Fetch price
            </button>
          </div>
        ),
      },
    ],
    [loading, selected, refreshPrices],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination, globalFilter },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const filtered = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const from = filtered ? pageIndex * pageSize + 1 : 0;
  const to = Math.min((pageIndex + 1) * pageSize, filtered);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          placeholder="Search this table…"
          className="h-10 min-w-[16rem] rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <Button
          type="button"
          disabled={loading}
          onClick={() => void refreshPrices(undefined, true)}
        >
          {loading ? 'Fetching…' : 'AI fill missing prices'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || selected.size === 0}
          onClick={() => void refreshPrices([...selected], false)}
        >
          AI price selected ({selected.size})
        </Button>
      </div>
      <p className="text-xs text-[var(--varnarc-subtle)]">
        AI prices are indicative India ex-showroom estimates, not dealer quotations. Verify before
        public use. Requires OPENAI_API_KEY on the API.
      </p>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      {!rows.length ? (
        <p className="rounded-lg border border-[var(--varnarc-border)] px-4 py-8 text-center text-sm text-[var(--varnarc-subtle)]">
          No vehicles in this result set.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
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
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
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
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--varnarc-subtle)]">
        <span>
          Showing {from}–{to} of {filtered}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            Rows
            <select
              className="h-8 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-2 text-sm"
              value={pageSize}
              onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
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
            Page {pageIndex + 1} of {Math.max(pageCount, 1)}
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
