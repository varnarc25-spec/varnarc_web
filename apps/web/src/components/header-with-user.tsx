import { SiteHeader } from '@/components/site-header';
import { loadHeaderUser } from '@/lib/header-user';
import { isAuthUiEnabled } from '@varnarc/auth';

export async function HeaderWithUser({
  navItems,
  siteName,
  tagline,
  logoUrl,
  stickyHeader,
}: {
  navItems?: Array<{ label: string; href: string }>;
  siteName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  stickyHeader?: boolean;
}) {
  const user = await loadHeaderUser();
  return (
    <SiteHeader
      user={user}
      authConfigured={isAuthUiEnabled()}
      navItems={navItems}
      siteName={siteName}
      tagline={tagline}
      logoUrl={logoUrl}
      stickyHeader={stickyHeader}
    />
  );
}
