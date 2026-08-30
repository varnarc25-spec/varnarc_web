import { ConstructionSeo } from '@/components/construction/construction-seo';
import { RccCalculatorClient } from '@/components/construction/rcc-calculator/rcc-calculator-client';
import { RCC_CALC_FAQS } from '@/components/construction/rcc-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('rcc-calculator', { searchParams: params });
}

export default async function RccCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'RCC calculator', path: '/construction/rcc-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc RCC Calculator',
          description:
            'Preliminary RCC concrete volume for slabs, beams, columns and footings. Indicative steel only with engineer-drawing disclaimer. Indicative only.',
          path: '/construction/rcc-calculator',
        }}
        faqs={RCC_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <RccCalculatorClient />
    </>
  );
}
