import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ContentLayout } from '@/components/layout/content-layout';
import { ProjectDashboardClient } from '@/components/construction/project-dashboard/project-dashboard-client';
import { fetchConstructionProject, fetchConstructionSuppliers } from '@/services/construction';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Construction project dashboard | Varnarc',
    description:
      'Project overview with estimate, materials, BOQ, timeline, budget, quotes, documents and suppliers.',
    robots: { index: false, follow: false },
    alternates: { canonical: `/construction/project/${id}` },
  };
}

export default async function ConstructionProjectDashboardPage({ params }: Props) {
  const { id } = await params;
  const [{ data, unauthorized, notFound: missing }, suppliersRes] = await Promise.all([
    fetchConstructionProject(id),
    fetchConstructionSuppliers(),
  ]);

  if (unauthorized) {
    return (
      <ContentLayout
        title="Project dashboard"
        description="Sign in to view this construction project."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Projects', href: '/construction/projects' },
          { label: 'Dashboard' },
        ]}
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">Authentication is required to open this project.</p>
          <Link
            href={`/auth/login?returnTo=${encodeURIComponent(`/construction/project/${id}`)}`}
            className="mt-3 inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
          >
            Log in
          </Link>
        </div>
      </ContentLayout>
    );
  }

  if (missing || !data) {
    notFound();
  }

  return (
    <ContentLayout
      title={data.name}
      description="Overview, estimate, materials, BOQ, timeline, budget, quotes, documents and suppliers."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Projects', href: '/construction/projects' },
        { label: data.name },
      ]}
    >
      <Suspense
        fallback={
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading dashboard…
          </div>
        }
      >
        <ProjectDashboardClient project={data} suppliers={suppliersRes.data ?? []} />
      </Suspense>
    </ContentLayout>
  );
}
