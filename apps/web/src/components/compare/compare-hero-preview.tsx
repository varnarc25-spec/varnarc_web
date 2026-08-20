export function CompareHeroPreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/70 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-600">
          Quick comparison
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['Finance', 'Cars', 'Home', 'Solar'].map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">Example of a side-by-side comparison layout</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Attribute
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Option A
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                Option B
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-600">
            {[
              ['Price', '—', '—'],
              ['Features', '✓', '✓'],
              ['Running cost', '—', '—'],
              ['Best suited for', '—', '—'],
            ].map(([label, a, b]) => (
              <tr key={label} className="border-t border-slate-100">
                <th scope="row" className="px-3 py-2.5 font-medium text-slate-800">
                  {label}
                </th>
                <td className="px-3 py-2.5">{a}</td>
                <td className="px-3 py-2.5">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[13px] font-semibold text-blue-700">View comparison →</p>
    </div>
  );
}
