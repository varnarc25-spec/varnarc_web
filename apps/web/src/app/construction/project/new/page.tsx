import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { ProjectWizardClient } from '@/components/construction/project-wizard/project-wizard-client';
import { apiServerFetch } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Create Construction Project | Varnarc',
  description:
    'Start a construction project with a guided wizard — name, location, type, size, quality and optional budget.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/construction/project/new' },
};

export default async function CreateConstructionProjectPage() {
  const authProbe = await apiServerFetch<unknown>('/auth/me');
  const isAuthenticated = authProbe.status !== 401 && !authProbe.error;

  return (
    <ContentLayout
      title="Create construction project"
      description="A short guided setup. You can go back anytime — your answers stay in this browser until the project is saved."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Projects', href: '/construction/projects' },
        { label: 'New' },
      ]}
    >
      <ProjectWizardClient isAuthenticated={isAuthenticated} />
    </ContentLayout>
  );
}
