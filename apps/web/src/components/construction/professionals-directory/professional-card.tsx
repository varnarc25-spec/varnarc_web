import Link from 'next/link';
import type { ProfessionalCard } from '@/lib/construction/professionals-directory/api';
import { cn } from '@/components/construction/styles';

export function ProfessionalCardView({
  professional,
  className,
}: {
  professional: ProfessionalCard;
  className?: string;
}) {
  return (
    <Link
      href={professional.href}
      className={cn(
        'block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-extrabold text-[#0b1f3a]">{professional.name}</h2>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {professional.sponsored ? (
            <span className="rounded-full bg-[#f97316] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          ) : null}
          {professional.verified ? (
            <span
              className="rounded-full bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              title={professional.verificationNote}
            >
              Verified
            </span>
          ) : null}
        </div>
      </div>
      {professional.professionalTypeLabels.length ? (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {professional.professionalTypeLabels.join(' · ')}
        </p>
      ) : null}
      {professional.location.city ? (
        <p className="mt-2 text-sm text-slate-600">{professional.location.city}</p>
      ) : null}
      {professional.specialities.length ? (
        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
          Specialities: {professional.specialities.slice(0, 4).join(', ')}
          {professional.specialities.length > 4 ? '…' : ''}
        </p>
      ) : null}
      {professional.experienceYears != null ? (
        <p className="mt-1 text-xs text-slate-500">
          {professional.experienceYears}+ years experience
        </p>
      ) : null}
      {professional.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{professional.description}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-400">
        Directory listing · Updated {new Date(professional.lastUpdated).toLocaleDateString('en-IN')}
      </p>
      <span className="mt-3 inline-block text-sm font-medium text-[#f97316]">View profile →</span>
    </Link>
  );
}
