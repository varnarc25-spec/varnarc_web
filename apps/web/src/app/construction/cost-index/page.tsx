import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { VcciPublishedView, VcciUnpublishedView } from '@/components/construction/vcci/vcci-views';
import { fetchVcciHub } from '@/lib/construction/vcci/api';
import {
  VCCI_METHODOLOGY_VERSION,
  VCCI_NAME,
  VCCI_QUALIFICATION,
  VCCI_SHORT_NAME,
} from '@varnarc/validation';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

export async function generateMetadata() {
  return buildConstructionPageMetadata('cost-index');
}

export const revalidate = 120;

export default async function VcciHubPage() {
  const hub = await fetchVcciHub();
  const published = hub?.published === true;

  return (
    <ContentLayout
      title={`${VCCI_SHORT_NAME} — ${VCCI_NAME}`}
      description={VCCI_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost index' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost index', path: '/construction/cost-index' },
        ])}
      />

      {published && hub ? (
        <VcciPublishedView hub={hub} />
      ) : (
        <VcciUnpublishedView
          blockers={
            hub?.blockers ?? ['Index service unavailable or no quality-gated snapshot published.']
          }
          frameworkVersion={hub?.methodology.frameworkVersion ?? VCCI_METHODOLOGY_VERSION}
        />
      )}

      <p className="mt-8 text-sm text-slate-600">
        <Link href="/construction/cost-index/methodology" className="font-semibold text-[#f97316]">
          Methodology
        </Link>
        {' · '}
        <Link href="/construction/prices" className="font-semibold text-[#f97316]">
          Prices
        </Link>
        {' · '}
        <Link href="/construction/estimate" className="font-semibold text-[#f97316]">
          Cost estimator
        </Link>
      </p>
    </ContentLayout>
  );
}
