import Link from 'next/link';

export type HubCompareRow = {
  provider: string;
  rate: string;
  fee: string;
  tenure: string;
  href?: string;
};

export function HubCompareTable({
  title,
  tabs,
  activeTab,
  rows,
  viewAllHref,
}: {
  title: string;
  tabs?: Array<{ label: string; href: string }>;
  activeTab?: string;
  rows: HubCompareRow[];
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full">
      <h3 className="text-base font-extrabold text-[#0b1f3a]">{title}</h3>
      {tabs?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                tab.label === activeTab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 pr-3 font-semibold">Provider</th>
              <th className="pb-2 pr-3 font-semibold">Rate</th>
              <th className="pb-2 pr-3 font-semibold">Fee</th>
              <th className="pb-2 font-semibold">Tenure</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.provider} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-[#0b1f3a]">
                  {row.href ? (
                    <Link href={row.href} className="hover:text-blue-600">
                      {row.provider}
                    </Link>
                  ) : (
                    row.provider
                  )}
                </td>
                <td className="py-2.5 pr-3 font-semibold text-blue-600">{row.rate}</td>
                <td className="py-2.5 pr-3 text-slate-600">{row.fee}</td>
                <td className="py-2.5 text-slate-600">{row.tenure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
        >
          View full comparison →
        </Link>
      ) : null}
    </div>
  );
}
