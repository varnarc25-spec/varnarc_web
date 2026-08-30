import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { EmptyState as SharedEmptyState } from '@/components/shared/empty-state';
import { cn, cx } from '@/components/construction/styles';

/** Construction-themed empty state — delegates to shared EmptyState when compact. */
export function EmptyState({
  title = 'Nothing here yet',
  message = 'Check back soon, or try a related tool.',
  action,
  compact = false,
  className,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  if (!compact) {
    return (
      <div className={className}>
        <SharedEmptyState title={title} message={message} action={action} />
      </div>
    );
  }

  return (
    <div
      className={cn(cx.card, 'flex flex-col items-center gap-3 px-4 py-10 text-center', className)}
    >
      <Inbox className="h-8 w-8 text-slate-400" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-[#0b1f3a]">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{message}</p>
      </div>
      {action}
    </div>
  );
}
