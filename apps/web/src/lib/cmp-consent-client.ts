'use client';

import { useEffect, useState } from 'react';
import { isCmpConfigured } from '@/lib/cmp-config';

export type CmpConsentCategory =
  | 'preferences'
  | 'functional'
  | 'analytics'
  | 'performance'
  | 'marketing'
  | 'social_media'
  | 'unclassified';

declare global {
  interface Window {
    __CMP__?: {
      ready?: boolean;
      consent?: Record<string, boolean>;
      hasConsent?: (category: string) => boolean;
      getConsent?: () => Record<string, boolean>;
      acceptAll?: () => void;
      rejectAll?: () => void;
      openPreferences?: () => void;
    };
  }
}

/** Read consent for a category from the CMP global, if available. */
export function readCmpConsent(category: CmpConsentCategory): boolean | null {
  const cmp = window.__CMP__;
  if (!cmp) return null;
  if (typeof cmp.hasConsent === 'function') return cmp.hasConsent(category);
  if (cmp.consent) return Boolean(cmp.consent[category]);
  return null;
}

/**
 * When CMP is configured, returns true only after the user grants the category.
 * When CMP is not configured, returns true (integrations load as before).
 */
export function useCmpConsentAllowed(category: CmpConsentCategory): boolean {
  const cmpEnabled = isCmpConfigured();
  const [allowed, setAllowed] = useState(!cmpEnabled);

  useEffect(() => {
    if (!cmpEnabled) {
      setAllowed(true);
      return;
    }

    function sync() {
      const value = readCmpConsent(category);
      if (value !== null) setAllowed(value);
    }

    sync();

    document.addEventListener('cmp:ready', sync);
    document.addEventListener('cmp:consent-update', sync);

    const poll = window.setInterval(() => {
      if (window.__CMP__?.ready || typeof window.__CMP__?.hasConsent === 'function') {
        sync();
        window.clearInterval(poll);
      }
    }, 200);

    return () => {
      document.removeEventListener('cmp:ready', sync);
      document.removeEventListener('cmp:consent-update', sync);
      window.clearInterval(poll);
    };
  }, [category, cmpEnabled]);

  return allowed;
}
