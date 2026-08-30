import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import type { ConstructionCrumb } from '@/components/construction/types';

/** Thin Construction wrapper around shared Breadcrumbs. */
export function ConstructionBreadcrumbs({ items }: { items: ConstructionCrumb[] }) {
  return <Breadcrumbs items={items} />;
}
