'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const TEMPLATES = [
  {
    entity: 'manufacturers',
    href: '/templates/automobile/automobile_manufacturers.csv',
    label: 'Manufacturers',
    table: 'automobile_manufacturers',
  },
  {
    entity: 'specs',
    href: '/templates/automobile/automobile_vehicles_from_specs.csv',
    label: 'Vehicles (from spec CSVs)',
    table: 'automobile_vehicles',
  },
  {
    entity: 'vehicles',
    href: '/templates/automobile/automobile_vehicles.csv',
    label: 'Vehicles (catalog columns)',
    table: 'automobile_vehicles',
  },
  {
    entity: 'vehicle-images',
    href: '/templates/automobile/automobile_vehicle_images.csv',
    label: 'Vehicle images',
    table: 'automobile_vehicle_images',
  },
  {
    entity: 'vehicle-reviews',
    href: '/templates/automobile/automobile_vehicle_reviews.csv',
    label: 'Vehicle reviews',
    table: 'automobile_vehicle_reviews',
  },
] as const;

export function AutomobileCsvMergePanel() {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [carsLoading, setCarsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function mergeUpload() {
    if (!files?.length) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const res = await fetch('/api/admin/automobile/import-merge', {
        method: 'POST',
        body: formData,
      });
      const json = (await res.json()) as {
        data?: { imported?: number; byEntity?: Record<string, number> };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Merge import failed');
      const parts = Object.entries(json.data?.byEntity ?? {})
        .map(([entity, count]) => `${entity}: ${count}`)
        .join(', ');
      setMessage(`Imported ${json.data?.imported ?? 0} rows${parts ? ` (${parts})` : ''}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Merge import failed');
    } finally {
      setLoading(false);
    }
  }

  async function mergeFromCars() {
    setCarsLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/automobile/import-from-cars', { method: 'POST' });
      const json = (await res.json()) as {
        data?: { imported?: number; skipped?: number };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Cars merge failed');
      setMessage(
        `Merged ${json.data?.imported ?? 0} rows from cars into manufacturers and vehicles` +
          (json.data?.skipped ? ` (${json.data.skipped} skipped)` : ''),
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cars merge failed');
    } finally {
      setCarsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h2 className="text-sm font-semibold">CSV templates</h2>
        <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">
          Download these files, fill them, then upload one or many at once. Files are matched by
          filename (manufacturer, vehicle, spec, image, review) or by column headers.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                download
                className="block rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm hover:bg-[var(--varnarc-muted)]"
              >
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-[var(--varnarc-subtle)]">
                  {item.table}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h2 className="text-sm font-semibold">Merge upload</h2>
        <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">
          Select all CSV files together. Import order is manufacturers → spec/vehicle rows → images
          → review links.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="text-sm"
          />
          <Button
            type="button"
            disabled={!files?.length || loading}
            onClick={() => void mergeUpload()}
          >
            {loading ? 'Merging…' : 'Upload and merge'}
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h2 className="text-sm font-semibold">Copy from cars table</h2>
        <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">
          If specification CSVs were already imported into <code>cars</code>, copy those rows into
          manufacturers and vehicles without downloading files.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={carsLoading}
            onClick={() => void mergeFromCars()}
          >
            {carsLoading ? 'Copying…' : 'Merge cars → catalog'}
          </Button>
        </div>
      </section>

      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      <section className="text-sm text-[var(--varnarc-subtle)]">
        <h2 className="mb-2 font-semibold text-[var(--varnarc-ink)]">Per-table import</h2>
        <p>
          You can also import a single file from Manufacturers or Vehicles using the CSV toolbar.
        </p>
      </section>
    </div>
  );
}
