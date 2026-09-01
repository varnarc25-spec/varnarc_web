import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionPlannerClient } from '@/components/construction/construction-planner-client';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import {
  defaultConstructionTimeline,
  fetchConstructionCostTemplates,
  fetchConstructionProjects,
} from '@/services/construction';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';

export async function generateMetadata() {
  return buildConstructionPageMetadata('planner');
}

export default async function ConstructionPlannerPage() {
  const [templatesRes, projectsRes] = await Promise.all([
    fetchConstructionCostTemplates(),
    fetchConstructionProjects(),
  ]);

  const templates = templatesRes.data ?? [];
  const projects = projectsRes.unauthorized ? [] : (projectsRes.data ?? []);
  const timeline = defaultConstructionTimeline();
  const defaults = CONSTRUCTION_PAGE_DEFAULTS.planner;

  return (
    <ContentLayout
      title={defaults.h1}
      description={defaults.description}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Planner' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Planner', path: '/construction/planner' },
        ])}
        webPage={{
          name: defaults.title,
          description: defaults.description,
          path: '/construction/planner',
        }}
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/construction/estimate"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <h2 className="text-sm font-extrabold text-[#0b1f3a]">Cost estimator</h2>
          <p className="mt-1 text-xs text-slate-500">
            Get a ballpark budget by area and quality tier.
          </p>
        </Link>
        <Link
          href="/construction/checklists"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <h2 className="text-sm font-extrabold text-[#0b1f3a]">Checklists</h2>
          <p className="mt-1 text-xs text-slate-500">
            Material and milestone lists for each build phase.
          </p>
        </Link>
        <Link
          href="/construction/projects"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          <h2 className="text-sm font-extrabold text-[#0b1f3a]">Saved projects</h2>
          <p className="mt-1 text-xs text-slate-500">
            Review budgets and notes from saved estimates.
          </p>
        </Link>
      </div>

      <ConstructionPlannerClient
        templates={templates.map((t) => ({ slug: t.slug, name: t.name }))}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          estimatedCost: p.estimatedCost,
          areaSqft: p.areaSqft,
        }))}
        timeline={timeline}
        unauthorized={projectsRes.unauthorized}
      />
    </ContentLayout>
  );
}
