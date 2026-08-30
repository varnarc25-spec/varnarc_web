import { ConstructionSeo } from '@/components/construction/construction-seo';
import { SandCalculatorClient } from '@/components/construction/sand-calculator/sand-calculator-client';
import { SAND_CALC_FAQS } from '@/components/construction/sand-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('sand-calculator', { searchParams: params });
}

export default async function SandCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Sand calculator', path: '/construction/sand-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Sand Calculator',
          description:
            'Calculate sand volume for concrete, masonry, plaster and filling with editable density, wastage and cost. Indicative only.',
          path: '/construction/sand-calculator',
        }}
        faqs={SAND_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <SandCalculatorClient />
    </>
  );
}
