import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { AccountNav } from '@/components/account-nav';
import { CancelMembershipButton } from '@/components/premium/cancel-membership-button';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = {
  title: 'Membership',
  alternates: { canonical: '/membership' },
};

type Membership = {
  subscription: {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    plan: { slug: string; name: string };
  } | null;
  isPremium: boolean;
};

export default async function MembershipPage() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const enabled = await isFeatureEnabled('premium.enabled');
  const token = await getApiAccessToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

  let membership: Membership | null = null;
  if (enabled && token) {
    const res = await fetch(`${apiUrl}/premium/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Membership };
      membership = json.data ?? null;
    }
  }

  return (
    <PageShell
      title="Membership"
      description="Your Varnarc premium subscription and billing status."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Membership' }]}
    >
      <AccountNav />

      {!enabled ? (
        <p className="text-sm text-slate-600">Premium billing is not enabled on this environment.</p>
      ) : membership?.subscription ? (
        <div className="max-w-lg space-y-4 rounded-xl border border-slate-200 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
            <p className="text-xl font-bold text-[#0b1f3a]">{membership.subscription.plan.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Status</p>
              <p className="font-medium capitalize">{membership.subscription.status.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-slate-500">Renews / ends</p>
              <p className="font-medium">
                {membership.subscription.endsAt
                  ? new Date(membership.subscription.endsAt).toLocaleDateString('en-IN')
                  : '—'}
              </p>
            </div>
          </div>
          {membership.isPremium && membership.subscription.status === 'ACTIVE' ? (
            <CancelMembershipButton />
          ) : null}
          <Link href="/premium" className="inline-block text-sm font-medium text-[var(--varnarc-brand)] hover:underline">
            Change plan
          </Link>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <p>You are on the free plan.</p>
          <Link
            href="/premium"
            className="inline-flex rounded-lg bg-[var(--varnarc-brand)] px-4 py-2 font-semibold text-white hover:opacity-90"
          >
            View premium plans
          </Link>
        </div>
      )}
    </PageShell>
  );
}
