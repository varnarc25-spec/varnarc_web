import Script from 'next/script';
import { getCmpDomainKey, getCmpEnv, getCmpSdkUrl } from '@/lib/cmp-config';

export function CmpSdkScript() {
  const domainKey = getCmpDomainKey();
  const sdkUrl = getCmpSdkUrl();
  if (!domainKey || !sdkUrl) return null;

  return (
    <Script
      id="cmp-sdk"
      src={sdkUrl}
      strategy="afterInteractive"
      data-domain-key={domainKey}
      data-env={getCmpEnv()}
    />
  );
}
