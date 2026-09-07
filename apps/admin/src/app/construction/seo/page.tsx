import { PageHeader } from '@varnarc/ui';
import { ConstructionPageSeoEditor } from '@/components/construction-page-seo-editor';
import { apiServerFetch } from '@/lib/api';

type ConstructionPageRow = {
  pageKey: string;
  label: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  heroImageUrl?: string | null;
  heroImageMediaId?: string | null;
  heroImageAlt?: string | null;
  heroImageWidth?: number | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
};

export default async function ConstructionHomePageSeoAdmin() {
  const hub = await apiServerFetch<ConstructionPageRow>('/construction/admin/pages/hub');

  return (
    <div>
      <PageHeader
        title="Construction home page"
        description="Upload the hero image and edit heading copy for /construction."
      />
      {hub.error ? <p className="text-sm text-red-600">{hub.error}</p> : null}
      {hub.data ? (
        <ConstructionPageSeoEditor pageKey={hub.data.pageKey} initial={hub.data} />
      ) : null}
    </div>
  );
}
