import Link from 'next/link';

export function HubSectionHeader({
  title,
  viewAllHref,
  viewAllLabel = 'View all →',
  id,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 id={id} className="text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl">
        {title}
      </h2>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="text-sm font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
  );
}
