import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileMaintenance } from '@/services/automobile';

export const metadata: Metadata = {
  title: 'Vehicle Maintenance',
  description: 'Service intervals and estimated maintenance costs by vehicle.',
  alternates: { canonical: '/automobile/maintenance' },
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ vehicleId?: string }>;
};

export default async function AutomobileMaintenancePage({ searchParams }: Props) {
  const params = await searchParams;
  const { data } = await fetchAutomobileMaintenance(params.vehicleId);

  return (
    <ContentLayout
      title="Maintenance schedules"
      description="Service intervals and estimated costs to plan ownership expenses."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Maintenance' },
      ]}
    >
      {params.vehicleId ? (
        <p className="mb-4 text-sm text-slate-600">
          Showing schedules for selected vehicle.{' '}
          <Link href="/automobile/maintenance" className="font-medium text-[#ea580c] hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {data.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Interval</th>
                <th className="px-4 py-3 font-semibold">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0b1f3a]">{row.title}</div>
                    {row.notes ? <p className="mt-1 text-xs text-slate-500">{row.notes}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    {row.vehicle?.slug ? (
                      <Link
                        href={`/automobile/vehicles/${row.vehicle.slug}`}
                        className="text-[#ea580c] hover:underline"
                      >
                        {row.vehicle.name}
                      </Link>
                    ) : (
                      row.vehicle?.name || '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{row.serviceInterval}</td>
                  <td className="px-4 py-3">
                    {row.estimatedCost != null ? `₹${row.estimatedCost}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No maintenance schedules yet"
          message="Service schedules will appear here once published."
        />
      )}

      <RelatedCalculators
        links={AUTOMOBILE_CALCULATOR_LINKS.filter((l) =>
          ['maintenance-cost', 'fuel', 'mileage'].some((s) => l.href.includes(s)),
        )}
      />
    </ContentLayout>
  );
}
