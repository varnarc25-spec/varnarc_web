import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';
import { PlacementCreateForm } from '@/components/placement-create-form';

type PlacementRow = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  rotationMode: string;
  _count?: { ads: number };
};

export default async function PlacementsPage() {
  const result = await apiServerFetch<PlacementRow[]>('/advertisements/placements?limit=100');
  const placements = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Ad placements"
        description="Named slots used by the public site and homepage builder."
        actions={<Badge>{placements.length} loaded</Badge>}
      />
      <Link href="/advertisements" className="mb-4 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
        ← Advertisements
      </Link>
      <PlacementCreateForm />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load placements</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Rotation</th>
                <th className="px-4 py-3 font-medium">Ads</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((p) => (
                <tr key={p.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3">{p.location || '—'}</td>
                  <td className="px-4 py-3">{p.rotationMode}</td>
                  <td className="px-4 py-3">{p._count?.ads ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
