import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { PreferencesForm } from '@/components/preferences-form';
import { AccountNav } from '@/components/account-nav';
import { auth0 } from '@/lib/auth0';

export const metadata: Metadata = {
  title: 'Preferences',
  alternates: { canonical: '/preferences' },
};

export default async function PreferencesPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  return (
    <PageShell
      title="My Preferences"
      description="Theme, notifications, and newsletter settings."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Preferences' }]}
    >
      <AccountNav />
      <PreferencesForm />
    </PageShell>
  );
}
