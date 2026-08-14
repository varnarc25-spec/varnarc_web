'use client';

import { useEffect, useRef } from 'react';
import { getCmpDomainKey, getCmpEnv, getCmpSdkUrl } from '@/lib/cmp-config';
import { isCmpTestScriptsEnabled } from '@/lib/cmp-test-scripts-config';

function ensureCmpTestScriptsLoader() {
  if (!isCmpTestScriptsEnabled()) return;
  if (document.getElementById('cmp-test-scripts')) return;

  const script = document.createElement('script');
  script.id = 'cmp-test-scripts';
  script.src = '/cmp-test-scripts.js';
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Loads the CMP SDK via a classic script element so document.currentScript and
 * data-domain-key are available when sdk.js runs (Next.js <Script> does not).
 */
export function CmpSdkScript() {
  const loaded = useRef(false);
  const domainKey = getCmpDomainKey();
  const sdkUrl = getCmpSdkUrl();
  const testScriptsEnabled = isCmpTestScriptsEnabled();

  useEffect(() => {
    if (!testScriptsEnabled) return;
    ensureCmpTestScriptsLoader();
    document.addEventListener('cmp:ready', ensureCmpTestScriptsLoader);
    return () => document.removeEventListener('cmp:ready', ensureCmpTestScriptsLoader);
  }, [testScriptsEnabled]);

  useEffect(() => {
    if (loaded.current || !domainKey || !sdkUrl) return;

    const existing = document.querySelector(
      `script[data-domain-key="${domainKey}"][src*="sdk.js"]`,
    );
    if (existing) {
      loaded.current = true;
      if (testScriptsEnabled) ensureCmpTestScriptsLoader();
      return;
    }

    const script = document.createElement('script');
    script.id = 'cmp-sdk';
    script.src = sdkUrl;
    script.async = true;
    script.setAttribute('data-domain-key', domainKey);
    script.setAttribute('data-env', getCmpEnv());
    if (testScriptsEnabled) {
      script.setAttribute('data-test-scripts', 'true');
    }
    if (testScriptsEnabled) {
      script.addEventListener('load', ensureCmpTestScriptsLoader, { once: true });
    }
    document.head.appendChild(script);
    loaded.current = true;

    return () => {
      if (testScriptsEnabled) {
        script.removeEventListener('load', ensureCmpTestScriptsLoader);
      }
    };
  }, [domainKey, sdkUrl, testScriptsEnabled]);

  return null;
}
