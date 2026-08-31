/**
 * Native head scripts so Google's tag tester can see gtag.js in the first HTML.
 * next/script afterInteractive is not present in the initial document.
 */
export function GoogleAnalyticsHead({ gaId }: { gaId: string }) {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
gtag('js', new Date());
gtag('config', '${gaId}');
`,
        }}
      />
    </>
  );
}
