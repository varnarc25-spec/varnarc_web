export function HubHeroOverview({ title = 'Your Finance Overview' }: { title?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-[#0b1f3a]">{title}</div>
        <span className="shrink-0 text-[10px] font-medium text-slate-400">Live snapshot</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Total investments
          </div>
          <div className="mt-1 text-base font-extrabold text-[#0b1f3a] sm:text-lg">₹12,45,000</div>
          <div className="mt-0.5 text-xs font-semibold text-emerald-600">+12.55% YoY</div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Monthly EMI
          </div>
          <div className="mt-1 text-base font-extrabold text-[#0b1f3a] sm:text-lg">₹32,650</div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-8 w-8 shrink-0 rounded-full border-4 border-blue-500 border-r-orange-400 border-b-emerald-400 border-l-violet-400 sm:h-9 sm:w-9"
              aria-hidden
            />
            <span className="text-[10px] text-slate-500">EMI split</span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-16 rounded-lg bg-slate-50 px-1 pt-1 sm:h-[4.5rem]">
        <svg viewBox="0 0 280 64" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="heroLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 46 L40 38 L80 42 L120 28 L160 32 L200 20 L240 24 L280 12 L280 64 L0 64 Z"
            fill="url(#heroLineGrad)"
          />
          <path
            d="M0 46 L40 38 L80 42 L120 28 L160 32 L200 20 L240 24 L280 12"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
