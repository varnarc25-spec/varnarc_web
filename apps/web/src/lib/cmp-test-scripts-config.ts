/** Fake IDs — only used when CMP test scripts are enabled. */
export const CMP_TEST_SCRIPT_IDS = {
  googleAnalytics: 'G-TESTCMP001',
  clarity: 'testcmp001',
  hotjar: '0000000',
  metaPixel: 'TESTCMP001',
  linkedInPartner: '0000000',
  crispWebsite: '00000000-0000-0000-0000-000000000000',
} as const;

/** Optional consent categories covered by cmp-test-scripts.js */
export type CmpTestScriptCategory =
  | 'preferences'
  | 'functional'
  | 'analytics'
  | 'performance'
  | 'marketing'
  | 'social_media'
  | 'unclassified';

export const CMP_TEST_SCRIPT_MARKERS: Record<CmpTestScriptCategory, string> = {
  preferences: 'cmp-test-preferences',
  functional: 'cmp-test-crisp',
  analytics: 'cmp-test-gtag',
  performance: 'cmp-test-web-vitals',
  marketing: 'cmp-test-meta-pixel',
  social_media: 'cmp-test-twitter',
  unclassified: 'cmp-test-unclassified',
};

/** Load third-party test scripts for CMP verification (banner, consent gating, scanner). */
export function isCmpTestScriptsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CMP_TEST_SCRIPTS?.trim() === 'true';
}
