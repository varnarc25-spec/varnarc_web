import Link from 'next/link';
import type { DirectoryVerticalGroup } from '@/lib/directory-hub';

export function DirectoryExploreCategories({ groups }: { groups: DirectoryVerticalGroup[] }) {
  if (!groups.length) return null;

  return (
    <section aria-labelledby="directory-explore-heading">
      <h2
        id="directory-explore-heading"
        className="text-2xl font-extrabold tracking-tight text-slate-950"
      >
        Explore more services
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Grouped by Varnarc verticals. Only categories with active listings are shown.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.key} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.1em] text-slate-500">
              {group.label}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/directory/${cat.slug}`}
                    className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                  >
                    {cat.name}
                    <span className="ml-1.5 text-slate-400">({cat.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
