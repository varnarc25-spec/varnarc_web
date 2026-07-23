import type { ReactNode } from 'react';
import { cn } from './cn';

export function Shell({
  sidebar,
  topbar,
  children,
  className,
  widthClassName = 'max-w-[1400px]',
}: {
  sidebar?: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
  className?: string;
  widthClassName?: string;
}) {
  return (
    <div className={cn('min-h-screen bg-[var(--varnarc-bg)] text-[var(--varnarc-ink)]', className)}>
      {topbar}
      <div className={cn('mx-auto flex w-full', widthClassName)}>
        {sidebar}
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
