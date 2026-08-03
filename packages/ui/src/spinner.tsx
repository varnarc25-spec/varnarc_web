import { cn } from './cn';

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Public URL path to the loading image (served from /public in each app). */
  src?: string;
};

const DEFAULT_LOADING_ICON = '/loading-icon.png';

const sizeClass = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const;

export function Spinner({
  className,
  label = 'Loading',
  size = 'md',
  src = DEFAULT_LOADING_ICON,
}: SpinnerProps) {
  return (
    <img
      src={src}
      alt=""
      role="status"
      aria-label={label}
      className={cn('animate-spin object-contain', sizeClass[size], className)}
    />
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
      <Spinner size="lg" label={label} />
      <p className="text-sm text-[var(--varnarc-subtle,#64748b)]">{label}</p>
    </div>
  );
}
