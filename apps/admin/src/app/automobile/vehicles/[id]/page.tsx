import Link from 'next/link';
import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import {
  AutomobileVehicleEditForm,
  AutomobileVehicleReviewLinker,
  AutomobileVersionHistory,
} from '@/components/automobile-forms';
import { apiServerFetch } from '@/lib/api';

type VehicleDetail = {
  id: string;
  name: string;
  status: string;
  model: string;
  variant?: string | null;
  fuelType?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  brochureMediaId?: string | null;
  images?: Array<{ mediaId?: string | null; imageUrl?: string | null }>;
  exShowroomPrice?: number | string | null;
  estimatedOnRoadPrice?: number | string | null;
  affiliateUrl?: string | null;
  description?: string | null;
  featured?: boolean;
  sponsored?: boolean;
  manufacturerId?: string | null;
  manufacturer?: { id: string; name: string } | null;
  reviewLinks?: Array<{ reviewId: string }>;
};

type ManufacturerRow = { id: string; name: string };

export default async function AutomobileVehicleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicleResult, manufacturersResult] = await Promise.all([
    apiServerFetch<VehicleDetail>(`/automobile/vehicles/${id}`),
    apiServerFetch<ManufacturerRow[]>('/automobile/admin/manufacturers?limit=100'),
  ]);
  const vehicle = vehicleResult.data;
  const manufacturers = Array.isArray(manufacturersResult.data) ? manufacturersResult.data : [];

  return (
    <div>
      <PageHeader
        title="Edit vehicle"
        description={vehicle?.name ?? 'Vehicle'}
        actions={
          <Link href="/automobile/vehicles" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to vehicles
          </Link>
        }
      />

      {vehicleResult.error || !vehicle ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load vehicle</CardTitle>
            <CardDescription>{vehicleResult.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>{vehicle.status}</Badge>
            {vehicle.featured ? <Badge>Featured</Badge> : null}
            {vehicle.sponsored ? <Badge>Sponsored</Badge> : null}
          </div>
          <AutomobileVehicleEditForm
            id={vehicle.id}
            manufacturers={manufacturers}
            initial={{
              manufacturerId: vehicle.manufacturerId ?? vehicle.manufacturer?.id,
              name: vehicle.name,
              model: vehicle.model,
              variant: vehicle.variant,
              fuelType: vehicle.fuelType,
              category: vehicle.category,
              imageUrl: vehicle.imageUrl,
              brochureMediaId: vehicle.brochureMediaId,
              galleryItems: (vehicle.images ?? []).map((img) => ({
                mediaId: img.mediaId,
                imageUrl: img.imageUrl,
                previewUrl: img.imageUrl,
              })),
              exShowroomPrice: vehicle.exShowroomPrice,
              estimatedOnRoadPrice: vehicle.estimatedOnRoadPrice,
              affiliateUrl: vehicle.affiliateUrl,
              description: vehicle.description,
              featured: vehicle.featured,
              sponsored: vehicle.sponsored,
            }}
          />
          <AutomobileVehicleReviewLinker
            vehicleId={vehicle.id}
            initialReviewIds={(vehicle.reviewLinks ?? []).map((link) => link.reviewId)}
          />
          <AutomobileVersionHistory entity="automobile_vehicle" entityId={vehicle.id} />
        </>
      )}
    </div>
  );
}
