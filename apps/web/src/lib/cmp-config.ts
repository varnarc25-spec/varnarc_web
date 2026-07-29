import { getApiBaseUrl } from '@/lib/runtime-public-env';

const PRODUCTION_CMP_DOMAIN_KEY = 'dk_764ba6aa7876dc2206390dd04d8f314b';
const PRODUCTION_CMP_SDK_URL =
  'https://consent-management-api-414895350436.us-central1.run.app/api/v1/public/cmp/sdk.js';

/** Domain key from CMP admin (e.g. dk_764ba6aa7876dc2206390dd04d8f314b). */
export function getCmpDomainKey(): string | null {
  const key = process.env.NEXT_PUBLIC_CMP_DOMAIN_KEY?.trim();
  if (key) return key;
  if (process.env.NODE_ENV === 'production') return PRODUCTION_CMP_DOMAIN_KEY;
  return null;
}

/** CMP environment label passed to the SDK (`data-env`). */
export function getCmpEnv(): string {
  return process.env.NEXT_PUBLIC_CMP_ENV?.trim() || 'production';
}

/** SDK script URL — defaults to production CMP API or `{API_BASE}/public/cmp/sdk.js`. */
export function getCmpSdkUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_CMP_SDK_URL?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === 'production') return PRODUCTION_CMP_SDK_URL;

  const domainKey = getCmpDomainKey();
  if (!domainKey) return null;

  return `${getApiBaseUrl()}/public/cmp/sdk.js`;
}

export function isCmpConfigured(): boolean {
  return Boolean(getCmpDomainKey() && getCmpSdkUrl());
}
