import type { ReactNode } from 'react';
import { ConstructionSection } from '@/components/construction/construction-section';

/** @deprecated Prefer ConstructionSection. Kept for existing page imports. */
export function ConstructionDetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <ConstructionSection title={title}>
      <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{children}</div>
    </ConstructionSection>
  );
}
