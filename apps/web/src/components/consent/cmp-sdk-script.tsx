'use client';

import { useEffect, useRef } from 'react';
import { getCmpDomainKey, getCmpEnv, getCmpSdkUrl } from '@/lib/cmp-config';

/**
 * Loads the CMP SDK via a classic script element so document.currentScript and
 * data-domain-key are available when sdk.js runs (Next.js <Script> does not).
 */
export function CmpSdkScript() {
  const loaded = useRef(false);
  const domainKey = getCmpDomainKey();
  const sdkUrl = getCmpSdkUrl();

  useEffect(() => {
    if (loaded.current || !domainKey || !sdkUrl) return;
    if (document.querySelector(`script[data-domain-key="${domainKey}"][src*="sdk.js"]`)) {
      loaded.current = true;
      return;
    }

    const script = document.createElement('script');
    script.id = 'cmp-sdk';
    script.src = sdkUrl;
    script.async = true;
    script.setAttribute('data-domain-key', domainKey);
    script.setAttribute('data-env', getCmpEnv());
    document.head.appendChild(script);
    loaded.current = true;

    return () => {
      script.remove();
    };
  }, [domainKey, sdkUrl]);

  return null;
}
