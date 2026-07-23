import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';
import type { CurrentUser } from '@varnarc/types';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminShell } from '@/components/admin-shell';
import { Providers } from '@/components/providers';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Varnarc Admin',
    template: '%s | Varnarc Admin',
  },
  description: 'Varnarc Platform administration',
  robots: { index: false, follow: false },
};

async function syncAndLoadUser(): Promise<{
  currentUser: CurrentUser | null;
  sessionPicture: string | null;
}> {
  const session = await auth0.getSession();
  if (!session?.user) return { currentUser: null, sessionPicture: null };

  const user = session.user as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  await apiServerFetch('/auth/sync', {
    method: 'POST',
    body: JSON.stringify({
      sub: user.sub,
      email: user.email,
      email_verified: user.email_verified,
      name: user.name,
      given_name: user.given_name,
      family_name: user.family_name,
      picture: user.picture,
    }),
  });

  const me = await apiServerFetch<CurrentUser>('/auth/me');
  if (me.error || !me.data) {
    return { currentUser: null, sessionPicture: user.picture || null };
  }

  return {
    currentUser: me.data,
    sessionPicture: user.picture || null,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-middleware-pathname') ?? '';
  const onAuthRoute = pathname.startsWith('/auth');
  const session = await auth0.getSession();

  // Auth routes (login/logout/callback) render without the admin chrome.
  if (!session?.user || onAuthRoute) {
    return (
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }

  const { currentUser, sessionPicture } = await syncAndLoadUser();
  if (!currentUser) {
    redirect('/auth/logout?returnTo=/auth/login');
  }

  return (
    <html lang="en">
      <body>
        <Providers>
          <AdminShell currentUser={currentUser} sessionPicture={sessionPicture}>
            {children}
          </AdminShell>
        </Providers>
      </body>
    </html>
  );
}
