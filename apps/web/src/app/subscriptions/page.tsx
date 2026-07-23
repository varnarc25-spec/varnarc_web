import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { SubscriptionsForm } from '@/components/subscriptions-form';
import { AccountNav } from '@/components/account-nav';
import { auth0 } from '@/lib/auth0';

export const metadata: Metadata = {
  title: 'My Subscriptions',
  alternates: { canonical: '/subscriptions' },
};

export default async function SubscriptionsPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  return (
    <PageShell
      title="My Subscriptions"
        description="Follow authors, categories, topics, and tags for a personalized article feed."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Subscriptions' }]}
    >
      <AccountNav />
      <SubscriptionsForm />
    </PageShell>
  );
}
