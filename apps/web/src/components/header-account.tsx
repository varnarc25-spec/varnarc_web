'use client';

import { useState } from 'react';
import Link from 'next/link';

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function HeaderAccount({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}) {
  const [broken, setBroken] = useState(false);
  const label = displayName || email || 'Account';
  const showImage = Boolean(avatarUrl) && !broken;

  return (
    <Link
      href="/profile"
      className="hidden items-center gap-2 text-sm text-[var(--varnarc-ink)] sm:inline-flex"
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--varnarc-border)]"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--varnarc-accent)] text-xs font-semibold text-white">
          {initials(label)}
        </span>
      )}
      <span className="max-w-[120px] truncate">{label}</span>
    </Link>
  );
}
