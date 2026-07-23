import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionBrandEditForm } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type BrandDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  website?: string | null;
  description?: string | null;
};

export default async function ConstructionBrandEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<BrandDetail>(`/construction/brands/${id}`);
  const brand = result.data;

  return (
    <div>
      <PageHeader
        title="Edit brand"
        description={brand?.name ?? 'Brand'}
        actions={
          <Link href="/construction/brands" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to brands
          </Link>
        }
      />

      {result.error || !brand ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load brand</CardTitle>
            <CardDescription>{result.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Badge className="mb-4">{brand.status}</Badge>
          <ConstructionBrandEditForm
            id={brand.id}
            initial={{
              name: brand.name,
              slug: brand.slug,
              website: brand.website,
              description: brand.description,
            }}
          />
        </>
      )}
    </div>
  );
}
