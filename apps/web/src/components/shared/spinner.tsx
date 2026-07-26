import { Spinner as UiSpinner } from '@varnarc/ui';
import { cn } from '@varnarc/ui';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <UiSpinner className={cn('text-[var(--varnarc-brand)]', className)} label={label} size="md" />
  );
}
