import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionCostDashboard } from '@/components/construction/cost-calculator/construction-cost-dashboard';
import { COST_CALC_FAQS } from '@/components/construction/cost-calculator/content';
import { buildSeoMetadata } from '@/lib/seo-metadata';

const PATH = '/calculators/construction-cost';
const TITLE = 'Construction Cost Calculator | Varnarc';
const DESCRIPTION =
  'Estimate house construction cost from area, city, floors and quality. Material quantities, BOQ and renovation ranges update with your selection. Indicative only — not a quote.';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await buildSeoMetadata({
    entityType: 'calculator',
    path: PATH,
    title: TITLE,
    description: DESCRIPTION,
  });
  return {
    ...metadata,
    title: TITLE,
    description: DESCRIPTION,
    alternates: { ...metadata.alternates, canonical: PATH },
  };
}

export default function ConstructionCostCatalogPage() {
  return (
    <ContentLayout
      title="Construction Cost Calculator"
      description={DESCRIPTION}
      hideTitle
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Calculators', href: '/calculators' },
        { label: 'Construction Cost Calculator' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Calculators', path: '/calculators' },
          { name: 'Construction Cost Calculator', path: PATH },
        ]}
        webApplication={{
          name: 'Varnarc Construction Cost Calculator',
          description: DESCRIPTION,
          path: PATH,
        }}
        faqs={COST_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ConstructionCostDashboard />
    </ContentLayout>
  );
}
