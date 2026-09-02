import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AutomobileCsvToolbar, AutomobileListSearch } from '@/components/automobile-admin-toolbar';
import { AutomobileVehicleForm } from '@/components/automobile-forms';
import { AutomobileVehiclesDataTable } from '@/components/automobile-vehicles-data-table';
import { apiServerFetch } from '@/lib/api';

type VehicleRow = {
  id: string;
  name: string;
  status: string;
  model?: string | null;
  fuelType?: string | null;
  exShowroomPrice?: number | string | null;
  sourceName?: string | null;
  manufacturer?: { name: string } | null;
};

type ManufacturerRow = { id: string; name: string };

export default async function AutomobileVehiclesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; fuelType?: string; category?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '100' });
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
        description="Manage vehicle catalog entries. Table is sortable and paginated. AI prices are estimates only."
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
        <AutomobileVehiclesDataTable rows={rows} />
      )}
    </div>
  );
}
