import type { HubHeroStep } from '@/lib/module-hub-configs';
import { HubHeroOverview } from '@/components/hub/hub-hero-overview';
import { HubHeroSteps } from '@/components/hub/hub-hero-steps';

export function HubHeroAsideStack({
  steps,
  overviewTitle = 'Your Finance Overview',
}: {
  steps: HubHeroStep[];
  overviewTitle?: string;
}) {
  return (
    <div className="rounded-xl bg-sky-100/60 p-3 shadow-sm sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr] sm:items-start sm:gap-4">
        <HubHeroOverview title={overviewTitle} />
        <HubHeroSteps steps={steps} showShieldBadge />
      </div>
    </div>
  );
}
