import { RelatedTools } from '@/components/construction/related-tools';

/** @deprecated Prefer RelatedTools. Kept for existing page imports. */
export function RelatedCalculators({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <RelatedTools
      items={links.map((l) => ({ href: l.href, label: l.label }))}
      title="Related calculators"
      variant="chips"
    />
  );
}
