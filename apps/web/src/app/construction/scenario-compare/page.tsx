import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ScenarioCompareClient } from '@/components/construction/scenario-compare/scenario-compare-client';
import { SCENARIO_COMPARE_FAQS } from '@/components/construction/scenario-compare/content';
import { apiServerFetch } from '@/lib/api';
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
  return buildConstructionPageMetadata('scenario-compare', { searchParams: params });
}

export default async function ScenarioComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const encoded = pick(params.s) ?? pick(params.scenarios) ?? null;
  const authProbe = await apiServerFetch<unknown>('/auth/me');
  const isAuthenticated = authProbe.status !== 401 && !authProbe.error;

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Scenario comparison', path: '/construction/scenario-compare' },
        ])}
        webApplication={{
          name: 'Varnarc Construction Scenario Comparison',
          description:
            'Compare up to three construction configurations side by side. Shared custom configs are noindex.',
          path: '/construction/scenario-compare',
        }}
        faqs={SCENARIO_COMPARE_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ScenarioCompareClient initialEncoded={encoded} isAuthenticated={isAuthenticated} />
    </>
  );
}
