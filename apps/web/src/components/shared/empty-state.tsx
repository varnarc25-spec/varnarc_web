import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  title = 'Nothing here yet',
  message = 'Check back soon for new content.',
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center">
      <Inbox className="h-10 w-10 text-[var(--varnarc-subtle)]" aria-hidden />
      <div>
        <h2 className="text-lg font-semibold text-[var(--varnarc-ink)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{message}</p>
      </div>
      {action}
    </div>
  );
}
