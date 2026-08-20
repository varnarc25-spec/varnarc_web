export function ReviewsHeroSnapshot() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/70 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-600">
          Review snapshot
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

      <p className="mt-4 text-[13px] font-medium text-slate-500">Product / service</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">
        4.5<span className="text-lg font-semibold text-slate-500"> / 5</span>
      </p>
      <p className="mt-1 text-[13px] font-semibold text-slate-600">Varnarc Editorial Rating</p>
      <p className="mt-1 text-[12px] text-slate-400">
        Illustrative layout — scores on live reviews come from published editorial assessments.
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2 text-[13px] text-slate-600">
        {['Value', 'Features', 'Reliability', 'Ease of use'].map((item) => (
          <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[13px] text-slate-500">
        Last reviewed:{' '}
        <span className="font-semibold text-slate-700">when the review was updated</span>
      </p>
      <p className="mt-3 text-[13px] font-semibold text-blue-700">Read full review →</p>
    </div>
  );
}
