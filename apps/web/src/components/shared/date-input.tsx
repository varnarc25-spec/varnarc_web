'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@varnarc/ui';

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  type?: 'date' | 'month';
};

function openPicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== 'function') return;
  try {
    input.showPicker();
  } catch {
    // Some browsers reject showPicker outside a user gesture.
  }
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { className, type = 'date', onClick, ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      type={type}
      className={cn(
        'cursor-pointer',
        '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0',
        '[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full',
        '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
        className,
      )}
      onClick={(e) => {
        openPicker(e.currentTarget);
        onClick?.(e);
      }}
    />
  );
});

export function openDatePicker(input: HTMLInputElement) {
  openPicker(input);
}
