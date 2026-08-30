'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn, cx } from '@/components/construction/styles';

/**
 * Fixed bottom CTA for mobile Construction tool flows.
 * Reserve bottom padding on the parent page when this is visible.
 */
export function StickyMobileCTA({
  primary,
  secondary,
  className,
}: {
  primary: { label: string; href?: string; onClick?: () => void; disabled?: boolean };
  secondary?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        {secondary ? <Action {...secondary} variant="secondary" /> : null}
        <Action {...primary} variant="primary" className="flex-1" />
      </div>
    </div>
  );
}

function Action({
  label,
  href,
  onClick,
  disabled,
  variant,
  className,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary';
  className?: string;
}): ReactNode {
  const styles = variant === 'primary' ? cx.primaryBtn : cx.secondaryBtn;

  if (href && !disabled) {
    return (
      <Link href={href} className={cn(styles, className)} onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cn(styles, className)}>
      {label}
    </button>
  );
}
