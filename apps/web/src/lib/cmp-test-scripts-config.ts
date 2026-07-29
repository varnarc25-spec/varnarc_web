/** Fake IDs — only used when CMP test scripts are enabled. */
export const CMP_TEST_SCRIPT_IDS = {
  googleAnalytics: 'G-TESTCMP001',
  clarity: 'testcmp001',
  hotjar: '0000000',
  metaPixel: 'TESTCMP001',
  linkedInPartner: '0000000',
  crispWebsite: '00000000-0000-0000-0000-000000000000',
} as const;

export type CmpTestScriptCategory = 'analytics' | 'marketing' | 'functional' | 'social_media';

/** Load third-party test scripts for CMP verification (banner, consent gating, scanner). */
export function isCmpTestScriptsEnabled(): boolean {
  const explicit = process.env.NEXT_PUBLIC_CMP_TEST_SCRIPTS?.trim();
  if (explicit === 'false') return false;
  if (explicit === 'true') return true;
  return process.env.NODE_ENV === 'production';
}
