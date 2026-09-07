import { describe, expect, it } from 'vitest';
import { publicAuthDisplayName, isAuth0Identifier } from '@varnarc/auth';

describe('publicAuthDisplayName', () => {
  it('does not show raw Auth0 user ids', () => {
    expect(
      publicAuthDisplayName({
        name: 'auth0_6a9e7763abcd',
        email: 'auth0_6a9e7763abcd@users.auth0.local',
      }),
    ).toBe('Account');
  });

  it('prefers a real email local-part', () => {
    expect(
      publicAuthDisplayName({
        name: 'auth0|abc',
        email: 'sai@example.com',
      }),
    ).toBe('sai');
  });

  it('detects auth0 identifiers', () => {
    expect(isAuth0Identifier('auth0|6a9e7763')).toBe(true);
    expect(isAuth0Identifier('Sai')).toBe(false);
  });
});
