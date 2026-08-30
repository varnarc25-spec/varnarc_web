import { ConstructionSeo } from '@/components/construction/construction-seo';
import { BbsCalculatorClient } from '@/components/construction/bbs-calculator/bbs-calculator-client';
import { BBS_CALC_FAQS } from '@/components/construction/bbs-calculator/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('bar-bending-schedule', { searchParams: params });
}

export default async function BarBendingSchedulePage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Bar bending schedule', path: '/construction/bar-bending-schedule' },
        ])}
        webApplication={{
          name: 'Varnarc Bar Bending Schedule',
          description:
            'Organize reinforcement quantities from user-entered bar details. Calculate length and weight with totals by diameter, member and project. Not structural design.',
          path: '/construction/bar-bending-schedule',
        }}
        faqs={BBS_CALC_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <BbsCalculatorClient />
    </>
  );
}
