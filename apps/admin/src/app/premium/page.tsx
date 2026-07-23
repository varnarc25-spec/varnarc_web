import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { PremiumPlanCreateForm } from '@/components/premium/premium-plan-create-form';

type Overview = {
  enabled?: boolean;
  counts?: { plans?: number; activeSubscriptions?: number; canceledSubscriptions?: number };
};

type Plan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  priceMonthly?: number | null;
  priceYearly?: number | null;
  isActive: boolean;
};

export default async function PremiumAdminPage() {
  const [overviewResult, plansResult] = await Promise.all([
    apiServerFetch<Overview>('/premium/admin/overview'),
    apiServerFetch<Plan[]>('/premium/admin/plans'),
  ]);

  const plans = plansResult.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Premium billing"
        description="Manage subscription plans and paid memberships."
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/premium/subscriptions" className="text-[var(--varnarc-brand)] hover:underline">
          Subscriptions
        </Link>
      </div>

      {overviewResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load overview</CardTitle>
            <CardDescription>{overviewResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi title="Feature enabled" value={overviewResult.data?.enabled ? 'Yes' : 'No'} />
          <Kpi title="Plans" value={String(overviewResult.data?.counts?.plans ?? 0)} />
          <Kpi
            title="Active subscriptions"
            value={String(overviewResult.data?.counts?.activeSubscriptions ?? 0)}
          />
        </div>
      )}

      <PremiumPlanCreateForm />

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Monthly</th>
              <th className="px-4 py-3">Yearly</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-xs text-slate-500">{plan.slug}</p>
                </td>
                <td className="px-4 py-3">₹{plan.priceMonthly ?? 0}</td>
                <td className="px-4 py-3">₹{plan.priceYearly ?? 0}</td>
                <td className="px-4 py-3">{plan.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
