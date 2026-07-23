'use client';

import { useState } from 'react';
import { SubscribeButton } from '@/components/premium/subscribe-button';

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number | null;
  priceYearly: number | null;
  features: string[] | null;
};

export function PremiumPricing({ plans, currentPlanSlug }: { plans: Plan[]; currentPlanSlug?: string | null }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-2">
        {(['monthly', 'yearly'] as const).map((cycle) => (
          <button
            key={cycle}
            type="button"
            onClick={() => setBillingCycle(cycle)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              billingCycle === cycle
                ? 'bg-[var(--varnarc-brand)] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {cycle}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price =
            billingCycle === 'yearly'
              ? plan.priceYearly
              : plan.priceMonthly;
          const features = Array.isArray(plan.features) ? plan.features : [];

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                plan.slug === 'pro' ? 'border-[var(--varnarc-brand)] shadow-md' : 'border-slate-200'
              }`}
            >
              <h2 className="text-lg font-bold text-[#0b1f3a]">{plan.name}</h2>
              {plan.description ? <p className="mt-2 text-sm text-slate-600">{plan.description}</p> : null}
              <p className="mt-4 text-3xl font-extrabold text-[#0b1f3a]">
                {price === 0 || price == null ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                {price && price > 0 ? (
                  <span className="text-sm font-normal text-slate-500">
                    /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                  </span>
                ) : null}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <div className="mt-6">
                <SubscribeButton
                  plan={plan}
                  billingCycle={billingCycle}
                  isCurrent={currentPlanSlug === plan.slug}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
