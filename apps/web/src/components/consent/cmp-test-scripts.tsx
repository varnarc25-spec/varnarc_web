'use client';

import { useEffect } from 'react';
import { CMP_TEST_SCRIPT_IDS } from '@/lib/cmp-test-scripts-config';

declare global {
  interface Window {
    __CMP__?: {
      ready?: boolean;
      hasConsent?: (category: string) => boolean;
    };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    hj?: (...args: unknown[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
    _linkedin_data_partner_ids?: string[];
  }
}

function hasCmpConsent(category: string): boolean {
  return Boolean(window.__CMP__?.hasConsent?.(category));
}

function scriptExists(id: string): boolean {
  return Boolean(document.getElementById(id));
}

function appendScript(
  id: string,
  init: (script: HTMLScriptElement) => void,
): HTMLScriptElement | null {
  if (scriptExists(id)) return null;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  init(script);
  document.head.appendChild(script);
  return script;
}

function ensureGoogleConsentModeStub() {
  if (typeof window.gtag === 'function') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

function updateGoogleConsentMode() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: hasCmpConsent('analytics') ? 'granted' : 'denied',
    ad_storage: hasCmpConsent('marketing') ? 'granted' : 'denied',
    ad_user_data: hasCmpConsent('marketing') ? 'granted' : 'denied',
    ad_personalization: hasCmpConsent('marketing') ? 'granted' : 'denied',
  });
}

function loadAnalyticsScripts() {
  const gaId = CMP_TEST_SCRIPT_IDS.googleAnalytics;
  appendScript('cmp-test-gtag', (script) => {
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  });
  appendScript('cmp-test-ga-init', (script) => {
    script.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
  });

  const clarityId = CMP_TEST_SCRIPT_IDS.clarity;
  appendScript('cmp-test-clarity', (script) => {
    script.textContent = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    `;
  });

  const hotjarId = CMP_TEST_SCRIPT_IDS.hotjar;
  appendScript('cmp-test-hotjar', (script) => {
    script.textContent = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hotjarId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
  });
}

function loadMarketingScripts() {
  appendScript('cmp-test-meta-pixel', (script) => {
    script.textContent = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${CMP_TEST_SCRIPT_IDS.metaPixel}');
      fbq('track', 'PageView');
    `;
  });

  const partnerId = CMP_TEST_SCRIPT_IDS.linkedInPartner;
  appendScript('cmp-test-linkedin-init', (script) => {
    script.textContent = `
      _linkedin_partner_id = "${partnerId}";
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    `;
  });
  appendScript('cmp-test-linkedin', (script) => {
    script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  });
}

function loadFunctionalScripts() {
  const websiteId = CMP_TEST_SCRIPT_IDS.crispWebsite;
  appendScript('cmp-test-crisp', (script) => {
    script.textContent = `
      window.$crisp=[];window.CRISP_WEBSITE_ID="${websiteId}";
      (function(){d=document;s=d.createElement("script");
      s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
    `;
  });
}

function loadSocialScripts() {
  appendScript('cmp-test-twitter', (script) => {
    script.src = 'https://platform.twitter.com/widgets.js';
    script.charset = 'utf-8';
  });
}

function syncTestScripts() {
  ensureGoogleConsentModeStub();
  updateGoogleConsentMode();

  if (hasCmpConsent('analytics')) loadAnalyticsScripts();
  if (hasCmpConsent('marketing')) loadMarketingScripts();
  if (hasCmpConsent('functional')) loadFunctionalScripts();
  if (hasCmpConsent('social_media')) loadSocialScripts();
}

function waitForCmpReady(): Promise<void> {
  if (window.__CMP__?.ready) return Promise.resolve();

  return new Promise((resolve) => {
    const onReady = () => {
      document.removeEventListener('cmp:ready', onReady);
      resolve();
    };
    document.addEventListener('cmp:ready', onReady);

    window.setTimeout(() => {
      document.removeEventListener('cmp:ready', onReady);
      resolve();
    }, 5000);
  });
}

/**
 * Loads well-known third-party scripts only after CMP consent is granted.
 * Uses fake IDs so no real tracking data is collected.
 */
export function CmpTestScripts() {
  useEffect(() => {
    let active = true;

    const run = async () => {
      await waitForCmpReady();
      if (!active) return;
      syncTestScripts();
    };

    const onConsentUpdate = () => {
      syncTestScripts();
    };

    void run();
    document.addEventListener('cmp:consent-update', onConsentUpdate);

    return () => {
      active = false;
      document.removeEventListener('cmp:consent-update', onConsentUpdate);
    };
  }, []);

  return null;
}
