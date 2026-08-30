import { ErrorState as SharedErrorState } from '@/components/shared/error-state';
import { cn, cx } from '@/components/construction/styles';

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this construction content. Please try again.',
  onRetry,
  compact = false,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  if (!compact) {
    return (
      <div className={className}>
        <SharedErrorState title={title} message={message} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div role="alert" className={cn(cx.card, 'border border-red-100 bg-red-50/60 p-4', className)}>
      <p className="text-sm font-semibold text-red-800">{title}</p>
      <p className="mt-1 text-xs text-red-700">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={cn(cx.secondaryBtn, 'mt-3')}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
