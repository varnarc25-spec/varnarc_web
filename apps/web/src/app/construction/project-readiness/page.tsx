import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ProjectReadinessClient } from '@/components/construction/project-readiness/project-readiness-client';
import { PROJECT_READINESS_FAQS } from '@/components/construction/project-readiness/content';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionPageMetadata('project-readiness', { searchParams: params });
}

export default async function ProjectReadinessPage() {
  return (
    <>
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Project readiness', path: '/construction/project-readiness' },
        ])}
        webApplication={{
          name: 'Varnarc Construction Project Readiness Checker',
          description:
            'Score construction planning readiness from a checklist. Explains how the score is calculated. Does not assess engineering adequacy or structural safety.',
          path: '/construction/project-readiness',
        }}
        faqs={PROJECT_READINESS_FAQS.map((f) => ({
          question: f.question,
          answer: f.answer,
        }))}
      />
      <ProjectReadinessClient />
    </>
  );
}
