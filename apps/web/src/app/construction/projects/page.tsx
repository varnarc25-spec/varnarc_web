import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { ConstructionProjectsClient } from '@/components/construction/construction-projects-client';
import { fetchConstructionChecklists, fetchConstructionProjects } from '@/services/construction';

export const metadata: Metadata = {
  title: 'My Construction Projects',
  description: 'Save and revisit construction planning projects.',
  alternates: { canonical: '/construction/projects' },
};

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
          <p className="text-sm text-amber-900">Sign in to save and view your construction projects.</p>
          <Link
            href="/auth/login?returnTo=/construction/projects"
            className="mt-3 inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
          >
            Log in
          </Link>
        </div>
      ) : data?.length ? (
        <ConstructionProjectsClient projects={data} checklists={checklists} />
      ) : (
        <EmptyState
          title="No projects yet"
          message="Create a project from the cost estimator once you are signed in."
          action={
            <Link
              href="/construction/estimate"
              className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
            >
              Get an estimate
            </Link>
          }
        />
      )}
    </ContentLayout>
  );
}
