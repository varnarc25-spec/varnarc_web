import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export function Badge({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-[var(--varnarc-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--varnarc-ink)]',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
