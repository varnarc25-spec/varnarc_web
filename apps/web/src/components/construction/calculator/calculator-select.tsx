'use client';

import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn, cx } from '@/components/construction/styles';

export function CalculatorSelect({
  id,
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  selectClassName,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  selectClassName?: string;
  className?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'>) {
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
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(cx.input, error ? 'border-red-300' : '', selectClassName)}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
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

export function UnitSelector({
  id = 'unit-selector',
  label = 'Unit',
  value,
  onChange,
  options,
  hint,
  className,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  className?: string;
}): ReactNode {
  if (options.length <= 4) {
    return (
      <fieldset className={cn('min-w-0', className)}>
        <legend className={cx.label}>{label}</legend>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={label}
          aria-describedby={hint ? `${id}-hint` : undefined}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(opt.value)}
                className={cn(
                  'min-h-11 rounded-lg border px-3 text-sm font-semibold transition',
                  cx.focus,
                  selected
                    ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                    : 'border-slate-200 bg-white text-[#0b1f3a] hover:border-[#f97316]',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {hint ? (
          <p id={`${id}-hint`} className={cx.helper}>
            {hint}
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <CalculatorSelect
      id={id}
      label={label}
      hint={hint}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      className={className}
    />
  );
}
