import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { DM_Sans, Fraunces } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { HeaderWithUser } from '@/components/header-with-user';
import { SiteFooter } from '@/components/site-footer';
import { AppProviders } from '@/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import { AnalyticsPageBeaconRoot } from '@/components/analytics/analytics-page-beacon-root';
import { WebVitalsReporterRoot } from '@/components/performance/web-vitals-reporter-root';
import { AnalyticsIntegrationsRoot } from '@/components/analytics/analytics-integrations-root';
import { CmpSdkScript } from '@/components/consent/cmp-sdk-script';
import { GoogleAnalyticsHead } from '@/components/analytics/google-analytics-head';
import { fetchPublicGoogleAnalyticsId } from '@/lib/google-analytics';
import { isCmpConfigured } from '@/lib/cmp-config';
import { isCmpTestScriptsEnabled } from '@/lib/cmp-test-scripts-config';
import { fetchAdsensePublicConfig, getAdsenseClientFromConfig } from '@/lib/adsense-config';
import { fetchMenuByLocation } from '@/services/content';
import { fetchActiveTheme, googleFontsHref } from '@/services/theme';
import { publicMenuLinks } from '@/lib/public-menu-links';
import { isAuthUiEnabled } from '@varnarc/auth';
import { getRuntimePublicEnvScript } from '@/lib/runtime-public-env';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/components/seo/json-ld';
import { getPublicSiteUrl } from '@/lib/public-site-url';
import {
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SEO_DESCRIPTION,
  seoDescriptionFromTagline,
  seoTitleFromBranding,
} from '@/lib/seo-defaults';
import './globals.css';

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getPublicSiteUrl();
  const theme = await fetchActiveTheme();
  const branding = theme?.branding ?? {};
  const siteName = branding.siteName?.trim() || 'Varnarc';
  const tagline = branding.siteTagline?.trim() || 'Smart Tools & Expert Guides';
  const titleDefault = seoTitleFromBranding(siteName, tagline);
  const description = seoDescriptionFromTagline(branding.siteTagline) || DEFAULT_SEO_DESCRIPTION;
  const ogImage = branding.ogImageUrl?.trim() || DEFAULT_OG_IMAGE_PATH;
  const icons: Metadata['icons'] = {};
  if (branding.faviconUrl) {
    icons.icon = branding.faviconUrl;
  }
  if (branding.appleTouchIconUrl) {
    icons.apple = branding.appleTouchIconUrl;
  }

  const verification: Metadata['verification'] = {};
  if (process.env.GOOGLE_SITE_VERIFICATION) {
    verification.google = process.env.GOOGLE_SITE_VERIFICATION;
  }
  if (process.env.BING_SITE_VERIFICATION) {
    verification.other = { 'msvalidate.01': process.env.BING_SITE_VERIFICATION };
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: titleDefault,
      template: '%s',
    },
    description,
    manifest: '/manifest.webmanifest',
    icons: Object.keys(icons).length ? icons : undefined,
    openGraph: {
      type: 'website',
      siteName,
      title: titleDefault,
      description,
      url: siteUrl,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: siteUrl,
    },
    verification: Object.keys(verification).length ? verification : undefined,
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: 'default',
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0b1f3a',
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [menuRes, footerRes, activeTheme, adsenseConfig, siteUrl, gaId] = await Promise.all([
    fetchMenuByLocation('header'),
    fetchMenuByLocation('footer'),
    fetchActiveTheme(),
    fetchAdsensePublicConfig(),
    getPublicSiteUrl(),
    fetchPublicGoogleAnalyticsId(),
  ]);

  const cmsNav = publicMenuLinks(menuRes.data);
  const nav = cmsNav ?? [{ label: 'Home', href: '/' }];
  const footerLinks = publicMenuLinks(footerRes.data) ?? undefined;

  const branding = activeTheme?.branding ?? {};
  const footerTokens = activeTheme?.tokens?.footer ?? {};
  const stickyHeader = activeTheme?.tokens?.navigation?.stickyHeader !== false;
  const adsenseClient = getAdsenseClientFromConfig(adsenseConfig);
  const fontsHref = googleFontsHref(
    activeTheme?.googleFonts ?? activeTheme?.fonts?.googleFonts ?? undefined,
  );

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        {gaId ? <GoogleAnalyticsHead gaId={gaId} /> : null}
        {(() => {
          const runtimeEnvScript = getRuntimePublicEnvScript();
          return runtimeEnvScript ? (
            <script dangerouslySetInnerHTML={{ __html: runtimeEnvScript }} />
          ) : null;
        })()}
        {fontsHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={fontsHref} />
          </>
        ) : null}
        {adsenseClient ? (
          <>
            <meta name="google-adsense-account" content={adsenseClient} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
              crossOrigin="anonymous"
            />
          </>
        ) : null}
        {isCmpConfigured() ? <CmpSdkScript /> : null}
        {isCmpConfigured() && isCmpTestScriptsEnabled() ? (
          <script id="cmp-test-scripts" src="/cmp-test-scripts.js" defer />
        ) : null}
      </head>
      <body className={sans.className}>
        <AppProviders themeStyleBlock={activeTheme?.cssStyleBlock} isAuthenticated={false}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--varnarc-brand)] focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen w-full flex-col">
            <Suspense
              fallback={
                <SiteHeader
                  user={null}
                  authConfigured={isAuthUiEnabled()}
                  navItems={nav}
                  siteName={branding.siteName}
                  tagline={branding.siteTagline}
                  logoUrl={branding.logoUrl}
                  stickyHeader={stickyHeader}
                />
              }
            >
              <HeaderWithUser
                navItems={nav}
                siteName={branding.siteName}
                tagline={branding.siteTagline}
                logoUrl={branding.logoUrl}
                stickyHeader={stickyHeader}
              />
            </Suspense>
            <JsonLd
              data={organizationJsonLd({
                name: branding.siteName?.trim() || 'Varnarc',
                description:
                  'Calculators, guides, reviews & tools for finance, home, automobiles and everyday planning.',
                url: siteUrl,
                logo: branding.logoUrl
                  ? `${siteUrl}${branding.logoUrl}`
                  : `${siteUrl}/brand/logo.png`,
                sameAs: (footerTokens.socialLinks as Array<{ href: string }> | null)
                  ?.map((l) => l.href)
                  .filter(Boolean),
              })}
            />
            <JsonLd
              data={websiteJsonLd({
                name: branding.siteName?.trim() || 'Varnarc',
                url: siteUrl,
                description: branding.siteTagline?.trim() || 'Smart Tools & Expert Guides',
                searchUrlTemplate: `${siteUrl}/search?q={search_term_string}`,
              })}
            />
            <div id="main-content" className="w-full min-w-0 flex-1" tabIndex={-1}>
              {children}
            </div>
            <SiteFooter
              cmsLinks={footerLinks}
              siteName={branding.siteName}
              tagline={branding.siteTagline}
              copyright={footerTokens.copyright}
              logoUrl={branding.logoUrl}
              socialLinks={footerTokens.socialLinks}
              newsletterEnabled={footerTokens.newsletterEnabled !== false}
              showAds={footerTokens.showAds !== false}
            />
          </div>
          <RegisterServiceWorker />
          <AnalyticsIntegrationsRoot />
          <AnalyticsPageBeaconRoot />
          <WebVitalsReporterRoot />
        </AppProviders>
      </body>
    </html>
  );
}
