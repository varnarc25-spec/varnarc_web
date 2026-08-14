import type { HubHeroStep } from '@/lib/module-hub-configs';
import { Shield } from 'lucide-react';
import { HubIcon } from '@/components/hub/hub-icons';

export function HubHeroSteps({
  steps,
  showShieldBadge = false,
}: {
  steps: HubHeroStep[];
  showShieldBadge?: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-slate-200/70 bg-white p-3 sm:p-4">
      {showShieldBadge ? (
        <div
          className="absolute -right-1.5 -top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
          aria-hidden
        >
          <Shield className="h-3.5 w-3.5" />
        </div>
      ) : null}
      <div className="text-sm font-bold text-[#0b1f3a]">Plan. Compare. Save.</div>
      <ul className="mt-3 space-y-2.5">
        {steps.map((step) => (
          <li key={step.title} className="flex gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${step.iconBg}`}
            >
              <HubIcon name={step.icon} className={`h-3.5 w-3.5 ${step.iconColor}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#0b1f3a] sm:text-sm">{step.title}</div>
              <div className="text-[11px] text-slate-500 line-clamp-2">{step.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
