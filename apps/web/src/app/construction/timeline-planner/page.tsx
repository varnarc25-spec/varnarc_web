import { Suspense } from 'react';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { TimelinePlannerClient } from '@/components/construction/timeline-planner/timeline-planner-client';
import { TIMELINE_PLANNER_FAQS } from '@/components/construction/timeline-planner/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('timeline-planner', { searchParams: params });
}

export default async function TimelinePlannerPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Timeline planner', path: '/construction/timeline-planner' },
        ])}
        webApplication={{
          name: 'Varnarc Construction Timeline Planner',
          description:
            'Plan construction phases with estimated whole-week durations, status and progress. Generate from start date, size, floors and construction type. Not a contractor programme.',
          path: '/construction/timeline-planner',
        }}
        faqs={TIMELINE_PLANNER_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <Suspense
        fallback={
          <div className="site-container py-10 text-sm text-slate-500">
            Loading timeline planner…
          </div>
        }
      >
        <TimelinePlannerClient />
      </Suspense>
    </>
  );
}
