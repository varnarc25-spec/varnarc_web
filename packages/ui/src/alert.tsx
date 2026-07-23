import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type AlertVariant = 'default' | 'success' | 'warning' | 'danger';

const variants: Record<AlertVariant, string> = {
  default: 'border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-ink)]',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
};

export function Alert({
  className,
  variant = 'default',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={cn('rounded-md border px-4 py-3 text-sm', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
