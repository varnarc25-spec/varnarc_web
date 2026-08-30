import { ConstructionSeo } from '@/components/construction/construction-seo';
import { CostOptimizationClient } from '@/components/construction/cost-optimization/cost-optimization-client';
import { COST_OPT_FAQS } from '@/components/construction/cost-optimization/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('cost-optimization', { searchParams: params });
}

export default async function CostOptimizationPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialParams: Record<string, string | undefined> = {
    location: pick(params.location),
    builtUpArea: pick(params.builtUpArea) ?? pick(params.area),
    quality: pick(params.quality),
    targetReduction: pick(params.targetReduction) ?? pick(params.target),
    target: pick(params.target),
    projectCost: pick(params.projectCost) ?? pick(params.estimatedCost),
    estimatedCost: pick(params.estimatedCost),
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Reduce my budget', path: '/construction/cost-optimization' },
        ])}
        webApplication={{
          name: 'Reduce my construction budget',
          description:
            'Suggest planning and finish adjustments to cut construction cost — never automatic structural downgrades. Indicative only.',
          path: '/construction/cost-optimization',
        }}
        faqs={COST_OPT_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <CostOptimizationClient initialParams={initialParams} />
    </>
  );
}
