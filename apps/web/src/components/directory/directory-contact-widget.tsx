'use client';

const linkClass =
  'inline-flex h-9 items-center rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] px-3 text-sm font-medium hover:bg-[var(--varnarc-surface)]';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function track(listingId: string, eventType: string) {
  try {
    await fetch(`${apiUrl}/directory/listings/${listingId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType }),
    });
  } catch {
    // best effort
  }
}

export function DirectoryContactWidget({
  listingId,
  phone,
  email,
  whatsapp,
  website,
}: {
  listingId: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="font-semibold">Contact</h3>
      <div className="flex flex-wrap gap-2">
        {phone ? (
          <a href={`tel:${phone}`} className={linkClass} onClick={() => void track(listingId, 'PHONE_CLICK')}>
            Call now
          </a>
        ) : null}
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={() => void track(listingId, 'WHATSAPP_CLICK')}
          >
            WhatsApp
          </a>
        ) : null}
        {email ? (
          <a href={`mailto:${email}`} className={linkClass} onClick={() => void track(listingId, 'EMAIL_CLICK')}>
            Email
          </a>
        ) : null}
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={() => void track(listingId, 'WEBSITE_CLICK')}
          >
            Website
          </a>
        ) : null}
      </div>
    </div>
  );
}
