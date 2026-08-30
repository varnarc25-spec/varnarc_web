/** Shared Construction UI class tokens — keep visual language aligned with Varnarc hubs. */

export const cx = {
  ink: 'text-[#0b1f3a]',
  muted: 'text-slate-600',
  subtle: 'text-slate-500',
  accent: 'text-[#f97316]',
  surface: 'bg-white',
  surfaceMuted: 'bg-slate-50',
  ring: 'ring-1 ring-slate-200/80',
  focus:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2',
  touch: 'min-h-11',
  card: 'rounded-xl bg-white ring-1 ring-slate-200/80',
  input:
    'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-900 tabular-nums sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
  label: 'mb-1.5 block text-sm font-medium text-slate-700',
  helper: 'mt-1 text-xs text-slate-500',
  error: 'mt-1 text-xs font-medium text-red-600',
  link: 'text-sm font-semibold text-[#0b1f3a] underline-offset-2 transition hover:text-[#f97316] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]',
  primaryBtn:
    'inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0b1f3a] px-4 text-sm font-semibold text-white transition hover:bg-[#122b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
  secondaryBtn:
    'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b1f3a] transition hover:border-[#f97316] hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2',
} as const;

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
