import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { SavedCalculationsList } from '@/components/calculators/saved-calculations-list';
import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Saved Calculations',
  alternates: { canonical: '/saved-calculations' },
};

type SavedRow = {
  id: string;
  name: string;
  createdAt: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown> | null;
  calculator?: { name: string; slug: string } | null;
};

export default async function SavedCalculationsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const result = await apiServerFetch<SavedRow[]>('/calculators/results?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <PageShell
      title="Saved Calculations"
      description="Your calculator results and scenarios."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Saved Calculations' }]}
    >
      {result.error ? (
        <p className="mb-4 text-sm text-red-600">{result.error}</p>
      ) : null}
      <SavedCalculationsList initial={rows} />
    </PageShell>
  );
}
