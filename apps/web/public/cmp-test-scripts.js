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

  function loadPreferencesScripts() {
    appendScript('cmp-test-preferences', function (script) {
      script.src = 'https://cdn.jsdelivr.net/npm/js-cookie@3/dist/js.cookie.min.js';
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

  function loadPerformanceScripts() {
    appendScript('cmp-test-web-vitals', function (script) {
      script.src =
        'https://cdn.jsdelivr.net/npm/web-vitals@3/dist/web-vitals.attribution.iife.js';
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

  function loadUnclassifiedScripts() {
    appendScript('cmp-test-unclassified', function (script) {
      script.textContent = 'window.__cmpTestUnclassifiedLoaded=true;';
    });
  }

  function syncTestScripts() {
    ensureGoogleConsentModeStub();
    updateGoogleConsentMode();
    if (hasConsent('preferences')) loadPreferencesScripts();
    if (hasConsent('functional')) loadFunctionalScripts();
    if (hasConsent('analytics')) loadAnalyticsScripts();
    if (hasConsent('performance')) loadPerformanceScripts();
    if (hasConsent('marketing')) loadMarketingScripts();
    if (hasConsent('social_media')) loadSocialScripts();
    if (hasConsent('unclassified')) loadUnclassifiedScripts();
  }

  function waitForCmpReady(callback) {
    if (window.__CMP__ && (window.__CMP__.ready || typeof window.__CMP__.hasConsent === 'function')) {
      callback();
      return;
    }

    var onReady = function () {
      document.removeEventListener('cmp:ready', onReady);
      callback();
    };
    document.addEventListener('cmp:ready', onReady);

    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (window.__CMP__ && (window.__CMP__.ready || typeof window.__CMP__.hasConsent === 'function')) {
        window.clearInterval(timer);
        document.removeEventListener('cmp:ready', onReady);
        callback();
        return;
      }
      if (attempts >= 100) {
        window.clearInterval(timer);
        document.removeEventListener('cmp:ready', onReady);
      }
    }, 50);
  }

  function start() {
    document.addEventListener('cmp:consent-update', syncTestScripts);
    waitForCmpReady(syncTestScripts);
  }

  start();
})();
