import { Loader2 } from 'lucide-react';
import { cn } from '@varnarc/ui';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <Loader2
      className={cn('h-5 w-5 animate-spin text-[var(--varnarc-brand)]', className)}
      aria-label={label}
      role="status"
    />
  );
}
