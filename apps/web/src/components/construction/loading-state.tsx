import { Skeleton } from '@/components/shared/skeleton';
import { cn } from '@/components/construction/styles';

export function LoadingState({
  label = 'Loading',
  variant = 'page',
  className,
}: {
  label?: string;
  variant?: 'page' | 'cards' | 'form' | 'inline';
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('flex items-center gap-2 text-sm text-slate-500', className)}
      >
        <span className="h-4 w-4 animate-pulse rounded-full bg-slate-300" aria-hidden />
        <span>{label}…</span>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div role="status" aria-label={label} className={cn('space-y-4', className)}>
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div
        role="status"
        aria-label={label}
        className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      >
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  return (
    <div role="status" aria-label={label} className={cn('space-y-6 py-4', className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
