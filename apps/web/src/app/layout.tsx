import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Fraunces } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { AppProviders } from '@/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import { AnalyticsPageBeaconRoot } from '@/components/analytics/analytics-page-beacon-root';
import { WebVitalsReporterRoot } from '@/components/performance/web-vitals-reporter-root';
import { AnalyticsIntegrationsRoot } from '@/components/analytics/analytics-integrations-root';
import { GoogleAdsenseScript } from '@/components/business/google-adsense';
import { getAdsenseClient } from '@/lib/adsense-config';
import { fetchMenuByLocation } from '@/services/content';
import { fetchActiveTheme, googleFontsHref } from '@/services/theme';
import { navItems as staticNavItems } from '@/features/home/static-data';
import { isAuth0Configured } from '@varnarc/auth';
import { getRuntimePublicEnvScript } from '@/lib/runtime-public-env';
import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';
import type { CurrentUser } from '@varnarc/types';
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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchActiveTheme();
  const branding = theme?.branding ?? {};
  const siteName = branding.siteName?.trim() || 'Varnarc';
  const tagline = branding.siteTagline?.trim() || 'Smart Tools & Expert Guides';
  const titleDefault = `${siteName} — ${tagline}`;
  const description =
    tagline ||
    'Calculators, guides, reviews & tools for finance, home, automobiles and everyday planning.';
  const icons: Metadata['icons'] = {};
  if (branding.faviconUrl) {
    icons.icon = branding.faviconUrl;
  }
  if (branding.appleTouchIconUrl) {
    icons.apple = branding.appleTouchIconUrl;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: titleDefault,
      template: `%s | ${siteName}`,
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
      ...(branding.ogImageUrl ? { images: [{ url: branding.ogImageUrl }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description,
      ...(branding.ogImageUrl ? { images: [branding.ogImageUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
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

export type HeaderUser = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  fromApi: boolean;
};

async function loadHeaderUser(): Promise<HeaderUser | null> {
  const session = await auth0.getSession();
  if (!session?.user) return null;

  const sessionUser = session.user as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  const fallback: HeaderUser = {
    email: sessionUser.email || sessionUser.sub || 'Signed in',
    displayName:
      sessionUser.name ||
      sessionUser.nickname ||
      sessionUser.email ||
      sessionUser.given_name ||
      'Account',
    avatarUrl: sessionUser.picture || null,
    fromApi: false,
  };

  try {
    await apiServerFetch('/auth/sync', {
      method: 'POST',
      body: JSON.stringify({
        sub: sessionUser.sub,
        email: sessionUser.email,
        email_verified: sessionUser.email_verified,
        name: sessionUser.name,
        given_name: sessionUser.given_name,
        family_name: sessionUser.family_name,
        picture: sessionUser.picture,
      }),
    });

    const me = await apiServerFetch<CurrentUser>('/auth/me');
    if (me.data) {
      return {
        email: me.data.email,
        displayName: me.data.displayName || me.data.email,
        avatarUrl: me.data.avatarUrl || sessionUser.picture || null,
        fromApi: true,
      };
    }
  } catch (error) {
    console.error('[auth] API sync/me failed; using Auth0 session for header', error);
  }

  return fallback;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [headerUser, menuRes, footerRes, activeTheme] = await Promise.all([
    loadHeaderUser(),
    fetchMenuByLocation('header'),
    fetchMenuByLocation('footer'),
    fetchActiveTheme(),
  ]);

  const cmsNav =
    menuRes.data?.items
      ?.filter((item) => item.href)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ label: item.label, href: item.href! })) ?? [];

  const staticNav = staticNavItems.map((item) => ({ label: item.label, href: item.href }));

  const nav = cmsNav.length >= staticNav.length ? cmsNav : staticNav;

  const footerLinks =
    footerRes.data?.items
      ?.filter((item) => item.href)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ label: item.label, href: item.href! })) ?? [];

  const branding = activeTheme?.branding ?? {};
  const footerTokens = activeTheme?.tokens?.footer ?? {};
  const stickyHeader = activeTheme?.tokens?.navigation?.stickyHeader !== false;
  const adsenseClient = getAdsenseClient();
  const fontsHref = googleFontsHref(
    activeTheme?.googleFonts ?? activeTheme?.fonts?.googleFonts ?? undefined,
  );

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
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
      </head>
      <body className={sans.className}>
        <AppProviders themeStyleBlock={activeTheme?.cssStyleBlock}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--varnarc-brand)] focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <div className="flex min-h-screen w-full flex-col">
            <SiteHeader
              user={headerUser}
              authConfigured={isAuth0Configured()}
              navItems={nav}
              siteName={branding.siteName}
              tagline={branding.siteTagline}
              logoUrl={branding.logoUrl}
              stickyHeader={stickyHeader}
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
          {adsenseClient ? <GoogleAdsenseScript client={adsenseClient} /> : null}
        </AppProviders>
      </body>
    </html>
  );
}
