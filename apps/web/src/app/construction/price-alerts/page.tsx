import { Suspense } from 'react';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PriceAlertsClient } from '@/components/construction/price-alerts/price-alerts-client';
import { PRICE_ALERT_QUALIFICATION } from '@varnarc/validation';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

export async function generateMetadata() {
  return buildConstructionPageMetadata('price-alerts');
}

export default async function PriceAlertsPage() {
  return (
    <ContentLayout
      title="Material price alerts"
      description={PRICE_ALERT_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Price alerts' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Price alerts', path: '/construction/price-alerts' },
        ])}
      />
      <Suspense fallback={<div className="py-8 text-sm text-slate-500">Loading price alerts…</div>}>
        <PriceAlertsClient />
      </Suspense>
    </ContentLayout>
  );
}
