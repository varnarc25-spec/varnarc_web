import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import {
  SavedConstructionCalculationsList,
  type SavedConstructionCalcRow,
} from '@/components/construction/saved-calculations/saved-construction-calculations-list';
import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';
import { cx } from '@/components/construction/styles';

export const metadata: Metadata = {
  title: 'Saved Construction Calculations | Varnarc',
  robots: { index: false, follow: false },
  alternates: { canonical: '/construction/saved-calculations' },
};

export default async function ConstructionSavedCalculationsPage() {
  const session = await auth0.getSession();
  if (!session?.user) {
    redirect(`/auth/login?returnTo=${encodeURIComponent('/construction/saved-calculations')}`);
  }

  const [calcs, projects] = await Promise.all([
    apiServerFetch<SavedConstructionCalcRow[]>('/construction/calculations'),
    apiServerFetch<Array<{ id: string; name: string }>>('/construction/projects'),
  ]);

  const rows = Array.isArray(calcs.data) ? calcs.data : [];
  const projectOptions = Array.isArray(projects.data)
    ? projects.data.map((p) => ({ id: p.id, name: p.name }))
    : [];

  return (
    <ContentLayout
      title="Saved calculations"
      description="View, rename, duplicate, delete, attach to a project, or recalculate with the latest methodology and rates. Original saved results are never overwritten by recalculation."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Saved calculations' },
      ]}
    >
      {calcs.error ? <p className="mb-4 text-sm text-rose-600">{calcs.error}</p> : null}

      <SavedConstructionCalculationsList initial={rows} projects={projectOptions} />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction" className={cx.secondaryBtn}>
          Construction hub
        </Link>
        <Link href="/saved-calculations" className={cx.secondaryBtn}>
          Other saved calculators
        </Link>
      </div>
    </ContentLayout>
  );
}
