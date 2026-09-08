import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { PlanningBoqClient } from '@/components/construction/planning-boq/planning-boq-client';
import { PLANNING_BOQ_FAQS } from '@/components/construction/planning-boq/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('boq-generator', { searchParams: params });
}

export default async function ConstructionBoqPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([{ name: 'BOQ', path: '/construction/boq' }])}
        webApplication={{
          name: 'Varnarc Construction BOQ Generator',
          description:
            'Planning bill of quantities with editable items, section subtotals, contingency and optional tax. Not a professional tender BOQ.',
          path: '/construction/boq',
        }}
        faqs={PLANNING_BOQ_FAQS.map((f) => ({ question: f.question, answer: f.answer }))}
      />
      <Suspense
        fallback={<div className="site-container py-10 text-sm text-slate-500">Loading BOQ…</div>}
      >
        <PlanningBoqClient />
      </Suspense>
    </>
  );
}
