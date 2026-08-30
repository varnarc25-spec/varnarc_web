'use client';

import { useEffect, useRef } from 'react';
import {
  readPendingConstructionSave,
  type ConstructionSavePayload,
} from '@/lib/construction/save-calculation/store';

/**
 * After login, restore the calculator UI from the pending save payload
 * (same sessionStorage key used to flush the POST).
 */
export function useRestorePendingConstructionSave(
  calculatorSlug: string,
  onRestore: (pending: ConstructionSavePayload) => void,
) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const pending = readPendingConstructionSave();
    if (!pending || pending.calculatorSlug !== calculatorSlug) return;
    done.current = true;
    onRestore(pending);
  }, [calculatorSlug, onRestore]);
}
