import type { ReactNode } from 'react';
import { cn } from '@/components/construction/styles';

/**
 * Wide construction tables stay readable on small screens via controlled
 * horizontal scroll instead of shrinking columns.
 */
export function ConstructionScrollTable({
  children,
  minWidthClass = 'min-w-[720px]',
  caption = 'Swipe sideways to see all columns.',
  className,
}: {
  children: ReactNode;
  minWidthClass?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="mb-2 text-xs text-slate-500 md:hidden">{caption}</p>
      <div
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <div className={minWidthClass}>{children}</div>
      </div>
    </div>
  );
}
