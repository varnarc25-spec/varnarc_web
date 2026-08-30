'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import {
  trackGuideClicked,
  trackRelatedLinkClicked,
  trackSearchResultClicked,
  trackSupplierClicked,
} from '@/lib/construction/analytics';

type TrackKind = 'guide' | 'supplier' | 'search_result' | 'related';

/**
 * Link wrapper that emits a sanitized Construction click event.
 * Never put personal data in `itemKey`.
 */
export function ConstructionTrackLink({
  href,
  kind,
  itemKey,
  resultType,
  surface,
  sourceEntityId,
  relation,
  children,
  className,
  ...rest
}: {
  href: string;
  kind: TrackKind;
  itemKey?: string;
  resultType?: string;
  surface?: string;
  sourceEntityId?: string;
  relation?: string;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof Link>, 'href' | 'onClick' | 'children' | 'className'>) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (kind === 'guide') {
          trackGuideClicked({ guide_key: itemKey, path: href });
        } else if (kind === 'supplier') {
          trackSupplierClicked({ supplier_key: itemKey, path: href });
        } else if (kind === 'related') {
          trackRelatedLinkClicked({
            source_entity_id: sourceEntityId ?? 'unknown',
            target_entity_id: itemKey,
            relation,
            href,
            surface: surface ?? 'construction',
          });
        } else {
          trackSearchResultClicked({
            surface: surface ?? 'construction',
            result_type: resultType ?? 'unknown',
            path: href,
          });
        }
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
