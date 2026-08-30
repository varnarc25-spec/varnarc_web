'use client';

import { useEffect, useRef } from 'react';
import { resolveConstructionShareFromSearchParams } from '@varnarc/validation';

/**
 * Restore calculator inputs from a shareable URL (`?s=` or flat safe params).
 * Call once on mount; does not touch project/private state.
 */
export function useRestoreSharedCalculation(
  calculatorSlug: string,
  onRestore: (inputs: Record<string, unknown>) => void,
) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (![...params.keys()].length) return;
    const inputs = resolveConstructionShareFromSearchParams(calculatorSlug, params);
    if (!inputs || !Object.keys(inputs).length) return;
    done.current = true;
    onRestore(inputs);
  }, [calculatorSlug, onRestore]);
}
