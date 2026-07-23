import { Button } from '@varnarc/ui';
import { AlertCircle } from 'lucide-react';

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center"
    >
      <AlertCircle className="h-10 w-10 text-[var(--varnarc-accent)]" aria-hidden />
      <div>
        <h2 className="text-lg font-semibold text-[var(--varnarc-ink)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
