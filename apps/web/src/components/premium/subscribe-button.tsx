'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Plan = {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number | null;
  priceYearly: number | null;
};

export function SubscribeButton({
  plan,
  billingCycle,
  isCurrent,
}: {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  isCurrent: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, billingCycle }),
      });
      if (res.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      const json = (await res.json()) as { error?: string; data?: unknown };
      if (!res.ok) {
        setError(json.error ?? 'Subscription failed');
        return;
      }
      router.push('/membership');
      router.refresh();
    } catch {
      setError('Subscription failed');
    } finally {
      setLoading(false);
    }
  }

  if (isCurrent) {
    return (
      <span className="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500">
        Current plan
      </span>
    );
  }

  if (plan.slug === 'free') {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void subscribe()}
        disabled={loading}
        className="inline-flex w-full justify-center rounded-lg bg-[var(--varnarc-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Processing…' : 'Subscribe'}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
