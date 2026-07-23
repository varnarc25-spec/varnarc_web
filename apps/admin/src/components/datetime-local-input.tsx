'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

type DateTimeLocalInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

function openPicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== 'function') return;
  try {
    input.showPicker();
  } catch {
    // Some browsers reject showPicker outside a user gesture.
  }
}

export const DateTimeLocalInput = forwardRef<HTMLInputElement, DateTimeLocalInputProps>(
  function DateTimeLocalInput({ className, onClick, ...props }, ref) {
    return (
      <input
        {...props}
        ref={ref}
        type="datetime-local"
        className={`cursor-pointer ${className ?? ''}`}
        onClick={(e) => {
          openPicker(e.currentTarget);
          onClick?.(e);
        }}
      />
    );
  },
);
