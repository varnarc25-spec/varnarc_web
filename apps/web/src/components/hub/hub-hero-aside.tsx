import type { HubHeroStep } from '@/lib/module-hub-configs';
import { HubIcon } from '@/components/hub/hub-icons';

export function HubHeroAside({
  overviewTitle = 'Overview',
  steps,
}: {
  overviewTitle?: string;
  steps: HubHeroStep[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="text-sm font-bold text-[#0b1f3a]">{overviewTitle}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Trend
            </div>
            <div className="mt-2 flex items-end gap-1 h-12">
              {[40, 55, 45, 70, 60, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-blue-500/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#0b1f3a]">This month</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 flex flex-col items-center justify-center">
            <div
              className="h-14 w-14 rounded-full border-[6px] border-blue-500 border-r-emerald-400 border-b-amber-400 border-l-violet-400"
              aria-hidden
            />
            <div className="mt-2 text-xs font-semibold text-[#0b1f3a]">Split view</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="text-sm font-bold text-[#0b1f3a]">Plan. Compare. Save.</div>
        <ul className="mt-4 space-y-3">
          {steps.map((step) => (
            <li key={step.title} className="flex gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${step.iconBg}`}
              >
                <HubIcon name={step.icon} className={`h-4 w-4 ${step.iconColor}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0b1f3a]">{step.title}</div>
                <div className="text-xs text-slate-500">{step.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
