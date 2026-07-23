import type { LabelHTMLAttributes } from 'react';
import { cn } from './cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1 block text-sm font-medium text-[var(--varnarc-ink)]', className)}
      {...props}
    />
  );
}
