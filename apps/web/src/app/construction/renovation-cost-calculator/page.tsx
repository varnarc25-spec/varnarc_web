import { ConstructionSeo } from '@/components/construction/construction-seo';
import { RenovationCostCalculatorClient } from '@/components/construction/renovation-cost-calculator/renovation-cost-calculator-client';
import { RENO_CALC_FAQS } from '@/components/construction/renovation-cost-calculator/content';
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
  return buildConstructionPageMetadata('renovation-cost-calculator', {
    searchParams: params,
  });
}

export default async function RenovationCostCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const authProbe = await apiServerFetch<unknown>('/auth/me');
  const isAuthenticated = authProbe.status !== 401 && !authProbe.error;

  const initialParams: Record<string, string | undefined> = {
    location: pick(params.location) ?? pick(params.region),
    region: pick(params.region),
    renovationArea: pick(params.renovationArea) ?? pick(params.areaSqft) ?? pick(params.area),
    area: pick(params.area),
    areaSqft: pick(params.areaSqft),
    areaUnit: pick(params.areaUnit),
    propertyAgeYears: pick(params.propertyAgeYears) ?? pick(params.age),
    age: pick(params.age),
    propertyType: pick(params.propertyType),
    contingencyPercent: pick(params.contingencyPercent) ?? pick(params.contingency),
    contingency: pick(params.contingency),
    work: pick(params.work),
  };

  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          {
            name: 'Renovation cost calculator',
            path: '/construction/renovation-cost-calculator',
          },
        ])}
        webApplication={{
          name: 'Varnarc Renovation Cost Calculator',
          description:
            'Estimate home renovation cost by selecting painting, kitchen, bathroom and other work — without a full new-build calculation. Indicative only.',
          path: '/construction/renovation-cost-calculator',
        }}
        faqs={RENO_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <RenovationCostCalculatorClient
        initialParams={initialParams}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
