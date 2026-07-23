import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchAutomobileCompare, fetchAutomobileVehicles } from '@/services/automobile';
import { ApiError } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Compare Vehicles',
  description: 'Side-by-side comparison of vehicles by specifications and price.',
  alternates: { canonical: '/automobile/compare' },
};

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function AutomobileComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const ids = params.ids?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

  let items: Array<Record<string, unknown>> = [];
  let error: string | null = null;
  const featured = ids.length < 2 ? await fetchAutomobileVehicles({ featured: true, limit: 2 }) : { data: [] };
  const starterIds = (featured.data ?? []).map((v) => v.id).filter(Boolean);
  const starterHref =
    starterIds.length >= 2 ? `/automobile/compare?ids=${starterIds.slice(0, 2).join(',')}` : null;

  if (ids.length >= 2) {
    try {
      const { data } = await fetchAutomobileCompare(ids);
      items = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    } catch (e) {
      error = e instanceof ApiError ? e.message : 'Unable to load comparison';
    }
  }

  return (
    <ContentLayout
      title="Compare vehicles"
      description="Side-by-side specs, pricing, and ownership attributes for published vehicles."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Compare' },
      ]}
    >
      {ids.length < 2 ? (
        <EmptyState
          title="Select vehicles to compare"
          message="Open two or more vehicle pages, or start with a featured pair."
          action={
            starterHref ? (
              <Link
                href={starterHref}
                className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
              >
                Compare featured vehicles
              </Link>
            ) : (
              <Link
                href="/automobile/vehicles"
                className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
              >
                Browse vehicles
              </Link>
            )
          }
        />
      ) : error ? (
        <EmptyState title="Comparison unavailable" message={error} />
      ) : items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Field</th>
                {items.map((item) => (
                  <th key={String(item.id)} className="px-4 py-3 font-semibold">
                    <Link
                      href={`/automobile/vehicles/${String(item.slug ?? item.id)}`}
                      className="text-[#0b1f3a] hover:text-[#ea580c]"
                    >
                      {String(item.name ?? item.id)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buildCompareRows(items).map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-600">{row.label}</td>
                  {row.values.map((value, idx) => (
                    <td key={idx} className="px-4 py-3">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No vehicles found" message="Those IDs did not resolve to published vehicles." />
      )}
    </ContentLayout>
  );
}

function cell(value: unknown) {
  if (value == null || value === '') return '—';
  return String(value);
}

function buildCompareRows(items: Array<Record<string, unknown>>) {
  const fields: Array<{ label: string; key: string }> = [
    { label: 'Manufacturer', key: 'manufacturer' },
    { label: 'Model', key: 'model' },
    { label: 'Variant', key: 'variant' },
    { label: 'Fuel', key: 'fuelType' },
    { label: 'Transmission', key: 'transmission' },
    { label: 'Mileage', key: 'mileage' },
    { label: 'Ex-showroom', key: 'exShowroomPrice' },
    { label: 'On-road', key: 'estimatedOnRoadPrice' },
    { label: 'Seating', key: 'seatingCapacity' },
    { label: 'Safety', key: 'safetyRating' },
  ];

  return fields.map((field) => ({
    label: field.label,
    values: items.map((item) => {
      if (field.key === 'manufacturer') {
        const mfr = item.manufacturer as { name?: string } | null | undefined;
        return cell(mfr?.name);
      }
      const value = item[field.key];
      if (field.key.includes('Price') && value != null) return `₹${value}`;
      return cell(value);
    }),
  }));
}
