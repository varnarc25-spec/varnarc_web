import { ConstructionSeo } from '@/components/construction/construction-seo';
import { AdvancedPlanningCalculatorClient } from '@/components/construction/advanced-calculators/advanced-planning-calculator-client';
import { ADVANCED_CALC_FAQS } from '@/components/construction/advanced-calculators/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import type { ConstructionPageKey } from '@/lib/construction/seo-pages';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TOOL: ConstructionPageKey = 'water-tank-calculator';

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata(TOOL, { searchParams: params });
}

export default async function WaterTankCalculatorPage() {
  const seo = CONSTRUCTION_PAGE_DEFAULTS[TOOL];
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: seo.label, path: seo.path }])}
        webApplication={{
          name: `Varnarc ${seo.h1}`,
          description: seo.description,
          path: seo.path,
        }}
        faqs={ADVANCED_CALC_FAQS[TOOL]}
      />
      <AdvancedPlanningCalculatorClient tool="water-tank" />
    </>
  );
}
