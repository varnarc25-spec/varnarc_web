import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionEstimateForm } from '@/components/construction/construction-forms-client';
import { RelatedCalculators } from '@/components/construction/construction-material-card';
import { RelatedArticles } from '@/components/construction/related-articles';
import { apiServerFetch } from '@/lib/api';
import { fetchConstructionCostTemplates } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction Cost Estimator',
  description: 'Estimate house construction costs by area, region, and quality tier.',
  alternates: { canonical: '/construction/estimate' },
};

export default async function ConstructionEstimatePage() {
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
    { href: '/calculators/paint', label: 'Paint Calculator' },
    { href: '/calculators/concrete', label: 'Concrete Calculator' },
    { href: '/calculators/brick', label: 'Brick Calculator' },
    { href: '/calculators/steel', label: 'Steel Calculator' },
    { href: '/calculators/tile', label: 'Tile Calculator' },
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
      <ConstructionEstimateForm
        templates={dashboardLinks}
        isAuthenticated={authProbe.status !== 401 && !authProbe.error}
      />
      <RelatedCalculators links={calculatorLinks} />
      <RelatedArticles />
    </ContentLayout>
  );
}
