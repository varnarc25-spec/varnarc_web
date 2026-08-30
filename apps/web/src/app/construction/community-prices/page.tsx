import { ConstructionSeo } from '@/components/construction/construction-seo';
import { CommunityPricesClient } from '@/components/construction/community-prices/community-prices-client';
import { COMMUNITY_PRICE_FAQS } from '@/components/construction/community-prices/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

export async function generateMetadata() {
  return buildConstructionPageMetadata('community-prices');
}

export default function CommunityPricesPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Community prices', path: '/construction/community-prices' },
        ])}
        webApplication={{
          name: 'Varnarc Community Material Price Reporting',
          description:
            'Moderated community material price reports with trust scoring. Unverified submissions never enter primary market prices. Invoices stay private.',
          path: '/construction/community-prices',
        }}
        faqs={COMMUNITY_PRICE_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <CommunityPricesClient />
    </>
  );
}
