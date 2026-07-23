import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AutomobileMaintenanceForm } from '@/components/automobile-forms';
import { apiServerFetch } from '@/lib/api';

type MaintenanceRow = {
  id: string;
  title: string;
  serviceInterval: string;
  estimatedCost?: number | string | null;
  notes?: string | null;
  vehicle?: { id: string; name: string } | null;
};

type VehicleRow = { id: string; name: string };

export default async function AutomobileMaintenanceAdminPage() {
  const [maintenanceResult, vehiclesResult] = await Promise.all([
    apiServerFetch<MaintenanceRow[]>('/automobile/admin/maintenance'),
    apiServerFetch<VehicleRow[]>('/automobile/admin/vehicles?limit=100'),
  ]);
  const rows = Array.isArray(maintenanceResult.data) ? maintenanceResult.data : [];
  const vehicles = Array.isArray(vehiclesResult.data) ? vehiclesResult.data : [];

  return (
    <div>
      <PageHeader
        title="Maintenance schedules"
        description="Service intervals and estimated costs by vehicle."
        actions={<Badge>{rows.length} entries</Badge>}
      />

      <AutomobileMaintenanceForm vehicles={vehicles} />

      {maintenanceResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load maintenance</CardTitle>
            <CardDescription>{maintenanceResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Interval</th>
                <th className="px-4 py-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{row.vehicle?.name || '—'}</td>
                  <td className="px-4 py-3">{row.serviceInterval}</td>
                  <td className="px-4 py-3">
                    {row.estimatedCost != null ? `₹${row.estimatedCost}` : '—'}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No maintenance schedules yet.
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
