'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type HubCompareRow = {
  provider: string;
  rate: string;
  fee: string;
  tenure: string;
  href?: string;
  logoColor?: string;
};

export type HubCompareTabGroup = {
  label: string;
  rows: HubCompareRow[];
  href?: string;
};

const LOGO_COLORS = ['bg-blue-600', 'bg-red-600', 'bg-orange-500', 'bg-indigo-600'];

export function HubCompareTable({
  title,
  tabGroups,
  tabs,
  activeTab,
  rows,
  viewAllHref,
  prominent = false,
  subtitle,
  headerLinkHref,
  headerLinkLabel = 'Compare now →',
  variant = 'default',
}: {
  title: string;
  tabGroups?: HubCompareTabGroup[];
  tabs?: Array<{ label: string; href: string }>;
  activeTab?: string;
  rows?: HubCompareRow[];
  viewAllHref?: string;
  prominent?: boolean;
  subtitle?: string;
  headerLinkHref?: string;
  headerLinkLabel?: string;
  variant?: 'default' | 'panel';
}) {
  const groups = useMemo((): HubCompareTabGroup[] => {
    if (tabGroups?.length) return tabGroups;
    if (tabs?.length && rows) {
      return tabs.map((tab) => ({
        label: tab.label,
        rows,
        href: tab.href,
      }));
    }
    return rows ? [{ label: activeTab ?? 'Compare', rows }] : [];
  }, [tabGroups, tabs, rows, activeTab]);

  const defaultIndex = groups.findIndex((g) => g.label === activeTab);
  const [activeIndex, setActiveIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);

  const safeIndex = activeIndex < groups.length ? activeIndex : 0;
  const current = groups[safeIndex];
  const currentRows = current?.rows ?? [];
  const tabViewAllHref = viewAllHref ?? current?.href;

  const isPanel = variant === 'panel';

  return (
    <div
      className={`w-full rounded-xl border border-slate-200 bg-white h-full min-h-0 ${
        isPanel ? 'p-4 shadow-sm' : prominent ? 'p-5 shadow-sm sm:p-6' : 'p-5 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`font-bold text-[#0b1f3a] ${isPanel || prominent ? 'text-base' : 'text-base'}`}
        >
          {title}
        </h3>
        {headerLinkHref ? (
          <Link
            href={headerLinkHref}
            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline"
          >
            {headerLinkLabel}
          </Link>
        ) : null}
      </div>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}

      {groups.length > 1 ? (
        <div
          className="mt-3 flex flex-wrap gap-3 border-b border-slate-200"
          role="tablist"
          aria-label="Product categories"
        >
          {groups.map((group, index) => {
            const isActive = index === safeIndex;
            return (
              <button
                key={group.label}
                type="button"
                role="tab"
                id={`compare-tab-${index}`}
                aria-selected={isActive}
                aria-controls={`compare-panel-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`pb-2 text-xs font-semibold transition sm:text-sm ${
                  isActive
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="mt-3 overflow-x-auto"
        role="tabpanel"
        id={`compare-panel-${safeIndex}`}
        aria-labelledby={`compare-tab-${safeIndex}`}
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 sm:text-sm">
              <th className="pb-2 pr-2 font-semibold">Provider</th>
              <th className="pb-2 pr-2 font-semibold text-right">Interest Rate</th>
              <th className="pb-2 pr-2 font-semibold text-right">Processing Fee</th>
              <th className="pb-2 font-semibold text-right">Max Tenure</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length ? (
              currentRows.map((row, index) => (
                <tr
                  key={`${row.provider}-${index}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                          row.logoColor ?? LOGO_COLORS[index % LOGO_COLORS.length]
                        }`}
                        aria-hidden
                      >
                        {row.provider.slice(0, 1)}
                      </span>
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="text-sm font-medium text-[#0b1f3a] hover:text-blue-600"
                        >
                          {row.provider}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-[#0b1f3a]">{row.provider}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-right text-sm font-semibold tabular-nums text-blue-600">
                    {row.rate}
                  </td>
                  <td className="py-2 pr-2 text-right text-sm tabular-nums text-slate-600">
                    {row.fee}
                  </td>
                  <td className="py-2 text-right text-sm tabular-nums text-slate-600">
                    {row.tenure}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                  No comparison data for this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tabViewAllHref ? (
        <div className="mt-4 flex justify-center">
          <Link
            href={tabViewAllHref}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            View Full Comparison →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
