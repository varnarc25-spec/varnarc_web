import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--varnarc-brand)] text-white hover:opacity-90',
  secondary: 'bg-[var(--varnarc-surface)] text-[var(--varnarc-ink)] border border-[var(--varnarc-border)] hover:bg-[var(--varnarc-muted)]',
  ghost: 'bg-transparent text-[var(--varnarc-ink)] hover:bg-[var(--varnarc-muted)]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition disabled:opacity-50',
        'rounded-[var(--vn-button-radius,0.375rem)]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
