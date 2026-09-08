import { ConstructionSeo } from '@/components/construction/construction-seo';
import { InteriorCostCalculatorClient } from '@/components/construction/interior-cost-calculator/interior-cost-calculator-client';
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
  return buildConstructionPageMetadata('interior-cost-calculator', { searchParams: params });
}

export default async function InteriorCostCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const authProbe = await apiServerFetch<unknown>('/auth/me');
  const isAuthenticated = authProbe.status !== 401 && !authProbe.error;

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          {
            name: 'Interior cost calculator',
            path: '/construction/interior-cost-calculator',
          },
        ])}
        webApplication={{
          name: 'Varnarc Interior Cost Calculator',
          description:
            'Estimate interior fit-out with indicative planning rates. Not a live dealer price or design contract.',
          path: '/construction/interior-cost-calculator',
        }}
      />
      <InteriorCostCalculatorClient
        isAuthenticated={isAuthenticated}
        initialParams={{
          location: pick(params.location),
          builtUpArea: pick(params.builtUpArea) ?? pick(params.area),
        }}
      />
    </>
  );
}
