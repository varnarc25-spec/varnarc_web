import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AutomobileCsvToolbar, AutomobileListSearch } from '@/components/automobile-admin-toolbar';
import {
  AutomobileDuplicateButton,
  AutomobilePublishButton,
  AutomobileVehicleForm,
} from '@/components/automobile-forms';
import { apiServerFetch } from '@/lib/api';

type VehicleRow = {
  id: string;
  name: string;
  status: string;
  model?: string | null;
  fuelType?: string | null;
  exShowroomPrice?: number | string | null;
  manufacturer?: { name: string } | null;
};

type ManufacturerRow = { id: string; name: string };

export default async function AutomobileVehiclesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; fuelType?: string; category?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.fuelType) qs.set('fuelType', params.fuelType);
  if (params.category) qs.set('category', params.category);

  const [vehiclesResult, manufacturersResult] = await Promise.all([
    apiServerFetch<VehicleRow[]>(`/automobile/admin/vehicles?${qs.toString()}`),
    apiServerFetch<ManufacturerRow[]>('/automobile/admin/manufacturers?limit=100'),
  ]);
  const rows = Array.isArray(vehiclesResult.data) ? vehiclesResult.data : [];
  const manufacturers = Array.isArray(manufacturersResult.data) ? manufacturersResult.data : [];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage vehicle catalog entries."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <AutomobileListSearch
        defaultValue={params.search}
        status={params.status}
        fuelType={params.fuelType}
        category={params.category}
        showVehicleFilters
      />
      <AutomobileCsvToolbar entity="vehicles" />
      <AutomobileVehicleForm manufacturers={manufacturers} />

      {vehiclesResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load vehicles</CardTitle>
            <CardDescription>{vehiclesResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Manufacturer</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Fuel</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.manufacturer?.name || '—'}</td>
                  <td className="px-4 py-3">{row.model || '—'}</td>
                  <td className="px-4 py-3">{row.fuelType || '—'}</td>
                  <td className="px-4 py-3">
                    {row.exShowroomPrice != null ? `₹${row.exShowroomPrice}` : '—'}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/automobile/vehicles/${row.id}`}
                        className="text-sm text-[var(--varnarc-brand)] hover:underline"
                      >
                        Edit
                      </Link>
                      <AutomobilePublishButton entity="vehicles" id={row.id} status={row.status} />
                      <AutomobileDuplicateButton id={row.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No vehicles yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
