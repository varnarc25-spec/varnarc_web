import { headers } from 'next/headers';
import {
  isAuth0Configured,
  appBaseUrlMatchesHost,
  publicAuthDisplayName,
  isUsableAvatarUrl,
} from '@varnarc/auth';
import { auth0 } from '@/lib/auth0';
import { apiServerFetch } from '@/lib/api';
import { isNextControlFlowError } from '@/lib/next-control-flow';
import type { CurrentUser } from '@varnarc/types';

export type HeaderUser = {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  fromApi: boolean;
};

export async function loadHeaderUser(): Promise<HeaderUser | null> {
  if (!isAuth0Configured()) return null;

  const host = (await headers()).get('host');
  if (!host || !appBaseUrlMatchesHost(host)) return null;

  let session;
  try {
    session = await auth0.getSession();
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error('[auth] getSession failed; treating as logged out', error);
    return null;
  }

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
    email: sessionUser.email || 'Signed in',
    displayName: publicAuthDisplayName({
      name: sessionUser.name,
      givenName: sessionUser.given_name,
      nickname: sessionUser.nickname,
      email: sessionUser.email,
    }),
    avatarUrl: isUsableAvatarUrl(sessionUser.picture) ? sessionUser.picture! : null,
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
        email: me.data.email || fallback.email,
        displayName: publicAuthDisplayName({
          name: me.data.displayName,
          givenName: me.data.firstName,
          email: me.data.email || sessionUser.email,
          fallback: fallback.displayName,
        }),
        avatarUrl:
          (isUsableAvatarUrl(me.data.avatarUrl) ? me.data.avatarUrl : null) || fallback.avatarUrl,
        fromApi: true,
      };
    }
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error('[auth] API sync/me failed; using Auth0 session for header', error);
  }

  return fallback;
}
