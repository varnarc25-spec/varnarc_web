import { ConstructionSeo } from '@/components/construction/construction-seo';
import { BeamCalculatorClient } from '@/components/construction/beam-calculator/beam-calculator-client';
import { BEAM_CALC_FAQS } from '@/components/construction/beam-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('beam-calculator', { searchParams: params });
}

export default async function BeamCalculatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Beam calculator', path: '/construction/beam-calculator' },
        ])}
        webApplication={{
          name: 'Varnarc Beam Volume Calculator',
          description:
            'Calculate RCC beam concrete volume from width, depth, length and quantity. Optional mix materials and cost. Does not generate structural reinforcement design.',
          path: '/construction/beam-calculator',
        }}
        faqs={BEAM_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <BeamCalculatorClient />
    </>
  );
}
