export type AffiliateBlockData = {
  label: string;
  url: string;
  disclosure?: string;
  sponsored?: boolean;
};

export function AffiliateBlockCard({
  label,
  url,
  disclosure = 'Affiliate link — we may earn a commission.',
  sponsored = false,
}: AffiliateBlockData) {
  return (
    <aside className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        {sponsored ? 'Sponsored offer' : 'Affiliate offer'}
      </p>
      <p className="mt-1 text-sm text-amber-900">{disclosure}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-3 inline-flex items-center rounded-md bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        {label}
      </a>
    </aside>
  );
}

const AFFILIATE_BLOCK_RE =
  /<div[^>]*data-affiliate-block="true"[^>]*data-label="([^"]*)"[^>]*data-url="([^"]*)"(?:[^>]*data-disclosure="([^"]*)")?(?:[^>]*data-sponsored="(true|false)")?[^>]*><\/div>/gi;

export function splitAffiliateBlocks(html: string): Array<{ type: 'html' | 'affiliate'; value: string | AffiliateBlockData }> {
  const parts: Array<{ type: 'html' | 'affiliate'; value: string | AffiliateBlockData }> = [];
  let lastIndex = 0;
  for (const match of html.matchAll(AFFILIATE_BLOCK_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: 'html', value: html.slice(lastIndex, index) });
    }
    parts.push({
      type: 'affiliate',
      value: {
        label: match[1] || 'Learn more',
        url: match[2] || '#',
        disclosure: match[3] || undefined,
        sponsored: match[4] === 'true',
      },
    });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < html.length) {
    parts.push({ type: 'html', value: html.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: 'html', value: html }];
}
