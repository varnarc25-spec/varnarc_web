import { ConstructionSeo } from '@/components/construction/construction-seo';
import { FootingCalculatorClient } from '@/components/construction/footing-calculator/footing-calculator-client';
import { FOOTING_CALC_FAQS } from '@/components/construction/footing-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('footing-calculator', { searchParams: params });
}

export default async function FootingCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Footing calculator', path: '/construction/footing-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Footing Concrete Calculator',
          description:
            'Calculate RCC footing concrete for rectangular and square footings with optional PCC bed, materials and cost. Does not size footings from building loads.',
          path: '/construction/footing-calculator',
        }}
        faqs={FOOTING_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <FootingCalculatorClient />
    </>
  );
}
