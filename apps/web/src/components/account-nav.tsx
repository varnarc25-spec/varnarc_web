'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/profile', label: 'Profile' },
  { href: '/bookmarks', label: 'Bookmarks' },
  { href: '/reading-history', label: 'Reading history' },
  { href: '/activity', label: 'Activity' },
  { href: '/preferences', label: 'Preferences' },
  { href: '/subscriptions', label: 'Subscriptions' },
  { href: '/membership', label: 'Membership' },
  { href: '/notifications', label: 'Notifications' },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Account">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? 'rounded-full bg-[#f97316] px-3 py-1 font-medium text-white'
                : 'rounded-full border border-[var(--varnarc-border)] px-3 py-1 text-[var(--varnarc-ink)] hover:border-[#f97316] hover:text-[#f97316]'
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
