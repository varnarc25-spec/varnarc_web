import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { MediaCollectionForm } from '@/components/media-collection-form';

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  assets?: Array<{ assetId: string }>;
};

export default async function MediaCollectionsPage() {
  const result = await apiServerFetch<CollectionRow[]>('/media/collections');
  const collections = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Media collections"
        description="Curated groups of assets for campaigns, galleries, and reuse."
        actions={
          <Link href="/media" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to library
          </Link>
        }
      />

      <MediaCollectionForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load collections</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
            >
              <h3 className="font-semibold">{collection.name}</h3>
              <p className="mt-1 font-mono text-xs text-[var(--varnarc-subtle)]">{collection.slug}</p>
              {collection.description ? (
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{collection.description}</p>
              ) : null}
              <p className="mt-3 text-xs text-[var(--varnarc-subtle)]">
                {collection.assets?.length ?? 0} assets
              </p>
            </div>
          ))}
          {!collections.length ? (
            <p className="text-sm text-[var(--varnarc-subtle)]">No collections yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
