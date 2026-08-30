'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  resolveConstructionInternalLinks,
  toConstructionRelatedLinkBuckets,
  type ConstructionInternalLinkOverrides,
  type ConstructionRelationKind,
} from '@varnarc/validation';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { ConstructionTrackLink } from '@/components/construction/construction-track-link';
import { cn } from '@/components/construction/styles';
import { trackRelatedLinkClicked } from '@/lib/construction/analytics';

type RelatedSectionContextValue = {
  depth: number;
  visited: ReadonlySet<string>;
  sourceEntityId: string | null;
};

const RelatedSectionContext = createContext<RelatedSectionContextValue>({
  depth: 0,
  visited: new Set(),
  sourceEntityId: null,
});

/**
 * Prevents nested ConstructionRelatedSection trees from expanding forever
 * (e.g. calculator → material → calculator → …).
 */
export function useConstructionRelatedSectionContext() {
  return useContext(RelatedSectionContext);
}

export type ConstructionRelatedSectionProps = {
  /** Graph entity id, e.g. `calc:cement` or `mat:steel`. */
  entityId: string;
  /** Optional editorial overrides for this render. */
  overrides?: ConstructionInternalLinkOverrides;
  /** Limit which relation sections appear. */
  relations?: ConstructionRelationKind[];
  className?: string;
  /** Analytics surface label. */
  surface?: string;
  /** When true, render nothing if already nested past max depth. */
  respectNesting?: boolean;
};

/**
 * Controlled internal-link recommendations for a Construction entity.
 * Caps, exclusions, and recursion guards live in `@varnarc/validation`.
 */
export function ConstructionRelatedSection({
  entityId,
  overrides,
  relations,
  className,
  surface = 'construction',
  respectNesting = true,
}: ConstructionRelatedSectionProps) {
  const parent = useConstructionRelatedSectionContext();
  const depth = parent.depth;
  const visited = useMemo(() => {
    const next = new Set(parent.visited);
    next.add(entityId);
    return next;
  }, [parent.visited, entityId]);

  if (respectNesting && depth > 0) {
    // Nested RelatedSection must not render another full block.
    return null;
  }

  const resolved = resolveConstructionInternalLinks({
    entityId,
    depth,
    visited,
    overrides,
    relations,
  });

  const buckets = toConstructionRelatedLinkBuckets(resolved);
  const hasAny =
    buckets.calculators.length +
      buckets.materials.length +
      buckets.comparisons.length +
      buckets.cityPages.length +
      buckets.guides.length >
    0;
  if (!hasAny) return null;

  const targetIdByHref = new Map(resolved.flat.map((item) => [item.href, item.id] as const));
  const relationByHref = new Map<string, string>();
  for (const section of resolved.sections) {
    for (const item of section.items) {
      relationByHref.set(item.href, section.relation);
    }
  }

  return (
    <RelatedSectionContext.Provider value={{ depth: depth + 1, visited, sourceEntityId: entityId }}>
      <div
        className={cn('construction-related-section', className)}
        data-entity-id={entityId}
        data-link-version={resolved.version}
      >
        <ConstructionRelatedLinks
          calculators={buckets.calculators}
          materials={buckets.materials.map((m) => ({
            ...m,
            materialKey: targetIdByHref.get(m.href),
          }))}
          comparisons={buckets.comparisons.map((c) => ({
            ...c,
            leftLabel: c.leftLabel || c.label,
            rightLabel: c.rightLabel || '',
          }))}
          cityPages={buckets.cityPages}
          guides={buckets.guides}
          onLinkClick={(href) => {
            trackRelatedLinkClicked({
              source_entity_id: entityId,
              target_entity_id: targetIdByHref.get(href),
              relation: relationByHref.get(href),
              href,
              surface,
            });
          }}
        />
      </div>
    </RelatedSectionContext.Provider>
  );
}

/**
 * Compact tracked chip row from resolved flat links (for inline placements).
 */
export function ConstructionRelatedInlineChips({
  entityId,
  limit = 5,
  label = 'Related',
  overrides,
}: {
  entityId: string;
  limit?: number;
  label?: string;
  overrides?: ConstructionInternalLinkOverrides;
}) {
  const parent = useConstructionRelatedSectionContext();
  if (parent.depth > 0) return null;

  const resolved = resolveConstructionInternalLinks({
    entityId,
    visited: parent.visited,
    overrides,
  });
  const items = resolved.flat.slice(0, Math.min(limit, 6));
  if (!items.length) return null;

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {items.map((item) => (
        <ConstructionTrackLink
          key={item.href}
          href={item.href}
          kind="related"
          itemKey={item.id}
          sourceEntityId={entityId}
          relation="inline"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#0b1f3a] hover:border-[#f97316] hover:text-[#f97316]"
        >
          {item.label}
        </ConstructionTrackLink>
      ))}
    </nav>
  );
}

/** Provider for pages that compose related blocks manually while sharing visited set. */
export function ConstructionRelatedScope({
  entityId,
  children,
}: {
  entityId: string;
  children: ReactNode;
}) {
  const parent = useConstructionRelatedSectionContext();
  const visited = useMemo(() => {
    const next = new Set(parent.visited);
    next.add(entityId);
    return next;
  }, [parent.visited, entityId]);

  return (
    <RelatedSectionContext.Provider
      value={{ depth: parent.depth + 1, visited, sourceEntityId: entityId }}
    >
      {children}
    </RelatedSectionContext.Provider>
  );
}
