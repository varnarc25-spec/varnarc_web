import { ConstructionSeo } from '@/components/construction/construction-seo';
import { CostChangeSimulatorClient } from '@/components/construction/cost-change-simulator/cost-change-simulator-client';
import { COST_SIM_FAQS } from '@/components/construction/cost-change-simulator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('cost-change-simulator', { searchParams: params });
}

export default async function CostChangeSimulatorPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          {
            name: 'Cost change simulator',
            path: '/construction/cost-change-simulator',
          },
        ])}
        webApplication={{
          name: 'What changes my construction cost?',
          description:
            'Interactive simulator for area, quality, floors and material rates using the Varnarc construction calculation engine. Educational only — not commodity price advice.',
          path: '/construction/cost-change-simulator',
        }}
        faqs={COST_SIM_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <CostChangeSimulatorClient />
    </>
  );
}
