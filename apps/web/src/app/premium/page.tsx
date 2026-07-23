import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { PremiumPricing } from '@/components/premium/premium-pricing';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { apiPublicFetch } from '@/services/api-client';
import { auth0 } from '@/lib/auth0';
import { getApiAccessToken } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Premium Plans',
  description: 'Upgrade to Varnarc Pro for ad-free browsing, premium calculators, and downloadable reports.',
  alternates: { canonical: '/premium' },
};

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number | null;
  priceYearly: number | null;
  features: string[] | null;
};

export default async function PremiumPage() {
  const enabled = await isFeatureEnabled('premium.enabled');
  if (!enabled) {
    redirect('/');
  }

  let plans: Plan[] = [];
  try {
    const res = await apiPublicFetch<Plan[]>('/premium/plans', { cache: 'no-store' });
    plans = res.data ?? [];
  } catch {
    plans = [];
  }

  let currentPlanSlug: string | null = null;
  const session = await auth0.getSession();
  if (session?.user) {
    const token = await getApiAccessToken();
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/premium/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = (await res.json()) as {
          data?: { subscription?: { plan?: { slug?: string } } | null };
        };
        currentPlanSlug = json.data?.subscription?.plan?.slug ?? 'free';
      }
    }
  }

  return (
    <PageShell
      title="Premium plans"
      description="Unlock ad-free browsing, premium calculators, downloadable reports, and more."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Premium' }]}
    >
      <PremiumPricing plans={plans} currentPlanSlug={currentPlanSlug} />
    </PageShell>
  );
}
