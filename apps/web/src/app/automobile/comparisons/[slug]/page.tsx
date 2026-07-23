import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchAutomobileComparisonBySlug } from '@/services/automobile';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchAutomobileComparisonBySlug(slug);
    return {
      title: data.title,
      description: `Compare ${data.vehicles?.length ?? 0} vehicles side by side.`,
      alternates: { canonical: `/automobile/comparisons/${slug}` },
    };
  } catch {
    return { title: 'Comparison', alternates: { canonical: `/automobile/comparisons/${slug}` } };
  }
}

export default async function AutomobileComparisonDetailPage({ params }: Props) {
  const { slug } = await params;
  let comparison: Awaited<ReturnType<typeof fetchAutomobileComparisonBySlug>>['data'];

  try {
    comparison = (await fetchAutomobileComparisonBySlug(slug)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    notFound();
  }

  const vehicles = comparison.vehicles ?? [];

  return (
    <ContentLayout
      title={comparison.title}
      description="Side-by-side specifications and pricing."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Comparisons', href: '/automobile/comparisons' },
        { label: comparison.title },
      ]}
    >
      {vehicles.length >= 2 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Field</th>
                {vehicles.map((item) => (
                  <th key={item.id} className="px-4 py-3 font-semibold">
                    <Link href={`/automobile/vehicles/${item.slug}`} className="text-[#ea580c] hover:underline">
                      {item.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Ex-showroom', key: 'exShowroomPrice', fmt: (v: unknown) => (v != null ? `₹${v}` : '—') },
                { label: 'On-road (est.)', key: 'estimatedOnRoadPrice', fmt: (v: unknown) => (v != null ? `₹${v}` : '—') },
                { label: 'Fuel', key: 'fuelType' },
                { label: 'Transmission', key: 'transmission' },
                { label: 'Mileage', key: 'mileage', fmt: (v: unknown) => (v != null ? `${v} km/l` : '—') },
                { label: 'Seating', key: 'seatingCapacity' },
                { label: 'Safety', key: 'safetyRating' },
              ].map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-600">{row.label}</td>
                  {vehicles.map((item) => {
                    const raw = item[row.key as keyof typeof item];
                    const value = row.fmt ? row.fmt(raw) : raw ?? '—';
                    return (
                      <td key={`${item.id}-${row.label}`} className="px-4 py-3">
                        {String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Comparison unavailable" message="Not enough published vehicles in this comparison." />
      )}
    </ContentLayout>
  );
}
