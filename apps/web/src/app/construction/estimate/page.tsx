import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionEstimateForm } from '@/components/construction/construction-forms-client';
import { RelatedCalculators } from '@/components/construction/construction-material-card';
import { RelatedArticles } from '@/components/construction/related-articles';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { apiServerFetch } from '@/lib/api';
import { fetchConstructionCostTemplates } from '@/services/construction';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('estimate', { searchParams: params });
}

export default async function ConstructionEstimatePage({ searchParams }: Props) {
  const params = await searchParams;
  const areaRaw = params.areaSqft;
  const regionRaw = params.region;
  const qualityRaw = params.quality;
  const initialAreaSqft = Array.isArray(areaRaw) ? areaRaw[0] : areaRaw;
  const initialRegion = Array.isArray(regionRaw) ? regionRaw[0] : regionRaw;
  const qualityParam = Array.isArray(qualityRaw) ? qualityRaw[0] : qualityRaw;
  const initialQuality =
    qualityParam === 'basic' || qualityParam === 'standard' || qualityParam === 'premium'
      ? qualityParam
      : null;

  const [{ data: templates }, authProbe] = await Promise.all([
    fetchConstructionCostTemplates(),
    apiServerFetch<unknown>('/auth/me'),
  ]);
  const templateOptions = (templates ?? []).map((t) => ({ slug: t.slug, name: t.name }));
  const dashboardLinks =
    templateOptions.length > 0
      ? templateOptions
      : [{ slug: 'house-construction', name: 'House construction' }];

  const calculatorLinks = [
    { href: '/calculators/construction-cost', label: 'Construction Cost Calculator' },
    { href: '/construction/paint-calculator', label: 'Paint Calculator' },
    { href: '/construction/concrete-calculator', label: 'Concrete Calculator' },
    { href: '/construction/brick-calculator', label: 'Brick Calculator' },
    { href: '/construction/steel-calculator', label: 'Steel Calculator' },
    { href: '/construction/tile-calculator', label: 'Tile Calculator' },
  ];

  return (
    <ContentLayout
      title="Cost estimator"
      description="Get a ballpark estimate by total area, or build a room-by-room estimate with custom line items."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost estimator' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost estimator', path: '/construction/estimate' },
        ])}
        webApplication={{
          name: 'Construction Cost Estimator',
          description:
            'Estimate house construction costs by area, region, and quality tier. Indicative only.',
          path: '/construction/estimate',
        }}
      />
      <ConstructionEstimateForm
        templates={dashboardLinks}
        isAuthenticated={authProbe.status !== 401 && !authProbe.error}
        initialAreaSqft={initialAreaSqft}
        initialRegion={initialRegion}
        initialQuality={initialQuality}
      />
      <RelatedCalculators links={calculatorLinks} />
      <RelatedArticles />
    </ContentLayout>
  );
}
