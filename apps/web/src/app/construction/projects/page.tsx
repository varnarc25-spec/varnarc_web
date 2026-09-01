import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionProjectsClient } from '@/components/construction/construction-projects-client';
import { fetchConstructionChecklists, fetchConstructionProjects } from '@/services/construction';
import { buildConstructionPageMetadata } from '@/lib/construction/seo';

export async function generateMetadata() {
  return buildConstructionPageMetadata('projects');
}

export default async function ConstructionProjectsPage() {
  const [{ data, unauthorized }, checklistsRes] = await Promise.all([
    fetchConstructionProjects(),
    fetchConstructionChecklists(),
  ]);
  const checklists = checklistsRes.data ?? [];

  return (
    <ContentLayout
      title="My projects"
      description="Track material checklists, budgets, and cost breakdowns for your builds."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Projects' },
      ]}
    >
      {unauthorized ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">
            Sign in to save and view your construction projects.
          </p>
          <Link
            href="/auth/login?returnTo=/construction/projects"
            className="mt-3 inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
          >
            Log in
          </Link>
        </div>
      ) : data?.length ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/construction/saved-calculations"
              className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a]"
            >
              Saved calculations
            </Link>
            <Link
              href="/construction/project/new"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Create project
            </Link>
          </div>
          <ConstructionProjectsClient projects={data} checklists={checklists} />
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          message="Start with a short guided setup, or save an estimate once you are signed in."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/construction/project/new"
                className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
              >
                Create project
              </Link>
              <Link
                href="/construction/estimate"
                className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a]"
              >
                Get an estimate
              </Link>
            </div>
          }
        />
      )}
    </ContentLayout>
  );
}
