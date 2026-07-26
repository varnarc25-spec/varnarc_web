import { cn } from './cn';

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const;

export function Spinner({ className, label = 'Loading', size = 'md' }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-current', sizeClass[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={label}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Spinner size="lg" className="text-[var(--varnarc-brand,#f97316)]" label={label} />
      <p className="text-sm text-[var(--varnarc-subtle,#64748b)]">{label}</p>
    </div>
  );
}
