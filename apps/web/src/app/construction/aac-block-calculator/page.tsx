import { ConstructionSeo } from '@/components/construction/construction-seo';
import { AacBlockCalculatorClient } from '@/components/construction/aac-block-calculator/aac-block-calculator-client';
import { AAC_CALC_FAQS } from '@/components/construction/aac-block-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('aac-block-calculator', { searchParams: params });
}

export default async function AacBlockCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'AAC block calculator', path: '/construction/aac-block-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc AAC Block Calculator',
          description:
            'Calculate AAC blocks for walls with openings, thin-bed adhesive, wastage and reverse coverage. Indicative only.',
          path: '/construction/aac-block-calculator',
        }}
        faqs={AAC_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <AacBlockCalculatorClient />
    </>
  );
}
