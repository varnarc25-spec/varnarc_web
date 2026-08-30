import { ConstructionSeo } from '@/components/construction/construction-seo';
import { SlabCalculatorClient } from '@/components/construction/slab-calculator/slab-calculator-client';
import { SLAB_CALC_FAQS } from '@/components/construction/slab-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('slab-calculator', { searchParams: params });
}

export default async function SlabCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Slab calculator', path: '/construction/slab-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Slab Calculator',
          description:
            'Calculate slab area and RCC concrete volume with optional mix materials and cost. Preliminary steel is clearly labelled and is not structural design.',
          path: '/construction/slab-calculator',
        }}
        faqs={SLAB_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <SlabCalculatorClient />
    </>
  );
}
