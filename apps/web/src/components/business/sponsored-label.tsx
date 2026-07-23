export function SponsoredLabel({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 ${className}`}
    >
      Sponsored
    </span>
  );
}

export function SponsoredBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ${className}`}
    >
      Sponsored listing
    </span>
  );
}
