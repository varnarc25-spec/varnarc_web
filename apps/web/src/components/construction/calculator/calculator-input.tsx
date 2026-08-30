'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn, cx } from '@/components/construction/styles';

export function CalculatorInput({
  id,
  label,
  hint,
  error,
  suffix,
  className,
  inputClassName,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> & {
    className?: string;
  }) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={cx.label}>
        {label}
        {props.required ? (
          <span className="ml-0.5 text-red-600" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            cx.input,
            suffix ? 'pr-12' : '',
            error ? 'border-red-300' : '',
            inputClassName,
          )}
          {...props}
          inputMode={props.inputMode ?? (props.type === 'number' ? 'decimal' : undefined)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className={cx.helper}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={cx.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
