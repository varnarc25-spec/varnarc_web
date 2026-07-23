'use client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const linkClass =
  'inline-flex h-9 items-center rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white hover:opacity-90';

async function track(toolId: string, eventType: string) {
  try {
    await fetch(`${apiUrl}/ai-tools/${toolId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType }),
    });
  } catch {
    // best effort
  }
}

export function AiAffiliateCta({
  toolId,
  affiliateUrl,
  website,
}: {
  toolId: string;
  affiliateUrl?: string | null;
  website?: string | null;
}) {
  const href = affiliateUrl || website;
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={linkClass}
      onClick={() => void track(toolId, affiliateUrl ? 'AFFILIATE_CLICK' : 'OUTBOUND_CLICK')}
    >
      Visit website
    </a>
  );
}
