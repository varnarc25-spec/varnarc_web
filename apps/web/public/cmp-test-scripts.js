(function () {
  var IDS = {
    googleAnalytics: 'G-TESTCMP001',
    clarity: 'testcmp001',
    hotjar: '0000000',
    metaPixel: 'TESTCMP001',
    linkedInPartner: '0000000',
    crispWebsite: '00000000-0000-0000-0000-000000000000',
  };

  function hasConsent(category) {
    var cmp = window.__CMP__;
    if (!cmp) return false;
    if (typeof cmp.hasConsent === 'function') return cmp.hasConsent(category);
    var consent = typeof cmp.getConsent === 'function' ? cmp.getConsent() : cmp.consent;
    return Boolean(consent && consent[category]);
  }

  function scriptExists(id) {
    return Boolean(document.getElementById(id));
  }

  function appendScript(id, init) {
    if (scriptExists(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.async = true;
    init(script);
    document.head.appendChild(script);
  }

  function ensureGoogleConsentModeStub() {
    if (typeof window.gtag === 'function') return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
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
      analytics_storage: hasConsent('analytics') ? 'granted' : 'denied',
      ad_storage: hasConsent('marketing') ? 'granted' : 'denied',
      ad_user_data: hasConsent('marketing') ? 'granted' : 'denied',
      ad_personalization: hasConsent('marketing') ? 'granted' : 'denied',
    });
  }

  function loadAnalyticsScripts() {
    appendScript('cmp-test-gtag', function (script) {
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + IDS.googleAnalytics;
    });
    appendScript('cmp-test-ga-init', function (script) {
      script.textContent =
        "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" +
        IDS.googleAnalytics +
        "');";
    });
    appendScript('cmp-test-clarity', function (script) {
      script.textContent =
        '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","' +
        IDS.clarity +
        '");';
    });
    appendScript('cmp-test-hotjar', function (script) {
      script.textContent =
        '(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:' +
        IDS.hotjar +
        ',hjsv:6};a=o.getElementsByTagName("head")[0];r=o.createElement("script");r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,"https://static.hotjar.com/c/hotjar-",".js?sv=");';
    });
  }

  function loadMarketingScripts() {
    appendScript('cmp-test-meta-pixel', function (script) {
      script.textContent =
        '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","' +
        IDS.metaPixel +
        '");fbq("track","PageView");';
    });
    appendScript('cmp-test-linkedin-init', function (script) {
      script.textContent =
        '_linkedin_partner_id="' +
        IDS.linkedInPartner +
        '";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);';
    });
    appendScript('cmp-test-linkedin', function (script) {
      script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    });
  }

  function loadFunctionalScripts() {
    appendScript('cmp-test-crisp', function (script) {
      script.textContent =
        'window.$crisp=[];window.CRISP_WEBSITE_ID="' +
        IDS.crispWebsite +
        '";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();';
    });
  }

  function loadSocialScripts() {
    appendScript('cmp-test-twitter', function (script) {
      script.src = 'https://platform.twitter.com/widgets.js';
      script.charset = 'utf-8';
    });
  }

  function syncTestScripts() {
    ensureGoogleConsentModeStub();
    updateGoogleConsentMode();
    if (hasConsent('analytics')) loadAnalyticsScripts();
    if (hasConsent('marketing')) loadMarketingScripts();
    if (hasConsent('functional')) loadFunctionalScripts();
    if (hasConsent('social_media')) loadSocialScripts();
  }

  function start() {
    syncTestScripts();
    document.addEventListener('cmp:ready', syncTestScripts);
    document.addEventListener('cmp:consent-update', syncTestScripts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
