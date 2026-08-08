import Link from 'next/link';

export function HubSectionHeader({
  title,
  viewAllHref,
  viewAllLabel = 'View all →',
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-xl font-extrabold text-[#0b1f3a] sm:text-2xl">{title}</h2>
      {viewAllHref ? (
        <Link href={viewAllHref} className="text-sm font-semibold text-blue-600 hover:underline">
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
  );
}
