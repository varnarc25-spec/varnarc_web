import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { ConstructionMaterialEditForm, ConstructionVersionHistory } from '@/components/construction-forms';
import { apiServerFetch } from '@/lib/api';

type MaterialDetail = {
  id: string;
  name: string;
  status: string;
  unit?: string | null;
  approximatePrice?: number | string | null;
  description?: string | null;
  specifications?: string | null;
  affiliateUrl?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  categoryId?: string | null;
  brandId?: string | null;
  category?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
};

type CategoryRow = { id: string; name: string };
type BrandRow = { id: string; name: string };

export default async function ConstructionMaterialEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [materialResult, categoriesResult, brandsResult] = await Promise.all([
    apiServerFetch<MaterialDetail>(`/construction/materials/${id}`),
    apiServerFetch<CategoryRow[]>('/construction/categories'),
    apiServerFetch<BrandRow[]>('/construction/admin/brands?limit=100'),
  ]);
  const material = materialResult.data;
  const categories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const brands = Array.isArray(brandsResult.data) ? brandsResult.data : [];

  return (
    <div>
      <PageHeader
        title="Edit material"
        description={material?.name ?? 'Material'}
        actions={
          <Link href="/construction/materials" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to materials
          </Link>
        }
      />

      {materialResult.error || !material ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load material</CardTitle>
            <CardDescription>{materialResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>{material.status}</Badge>
            {material.featured ? <Badge>Featured</Badge> : null}
            {material.sponsored ? <Badge>Sponsored</Badge> : null}
          </div>
          <ConstructionMaterialEditForm
            id={material.id}
            categories={categories}
            brands={brands}
            initial={{
              categoryId: material.categoryId ?? material.category?.id,
              brandId: material.brandId ?? material.brand?.id,
              name: material.name,
              unit: material.unit,
              approximatePrice: material.approximatePrice,
              description: material.description,
              specifications: material.specifications,
              affiliateUrl: material.affiliateUrl,
              featured: material.featured,
              sponsored: material.sponsored,
            }}
          />
          <ConstructionVersionHistory entity="construction_material" entityId={material.id} />
        </>
      )}
    </div>
  );
}
