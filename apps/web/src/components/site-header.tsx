'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { navItems } from '@/features/home/static-data';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LocaleSwitch } from '@/components/shared/locale-switch';
import { SearchAutocomplete } from '@/components/search/search-autocomplete';
import { NotificationBell } from '@/components/notifications/notification-bell';

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

function HeaderSearch({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <SearchAutocomplete inputId="header-search" placeholder="Search calculators, guides, tools..." />
    </div>
  );
}

export function SiteHeader({
  user,
  navItems: navProp,
  siteName,
  tagline,
  logoUrl,
  stickyHeader = true,
}: {
  user?: {
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  navItems?: Array<{ label: string; href: string }>;
  siteName?: string | null;
  tagline?: string | null;
  logoUrl?: string | null;
  stickyHeader?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const authConfigured = process.env.NEXT_PUBLIC_AUTH0_CONFIGURED === 'true';
  const items = navProp?.length
    ? navProp
    : navItems.map((item) => ({ label: item.label, href: item.href }));
  const brand = siteName?.trim() || 'Varnarc';
  const brandTagline = tagline?.trim() || 'Finance • Home • Auto • Tools';

  return (
    <header
      className={`full-bleed z-40 w-full bg-[var(--color-header,var(--varnarc-surface))] shadow-sm ${
        stickyHeader ? 'sticky top-0' : 'relative'
      }`}
    >
      <div className="border-b border-[var(--varnarc-border)]">
        <div className="site-container relative flex h-14 items-center justify-between gap-3">
          <Link href="/" className="relative z-10 shrink-0">
            <span className="flex items-center gap-2 sm:gap-2.5">
              <img
                src={logoUrl || '/brand/logo.png'}
                alt={brand}
                width={40}
                height={40}
                className="h-9 w-9 shrink-0 rounded-md object-contain sm:h-10 sm:w-10"
              />
              <span className="hidden min-[420px]:block">
                <span className="block text-base font-bold leading-none tracking-tight text-[var(--varnarc-ink)]">
                  {brand}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-[var(--varnarc-subtle)]">
                  {brandTagline}
                </span>
              </span>
            </span>
          </Link>

          <HeaderSearch className="absolute left-1/2 top-1/2 hidden w-[40%] -translate-x-1/2 -translate-y-1/2 md:block" />

          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <LocaleSwitch />
            <ThemeToggle />
            {user ? <NotificationBell /> : null}
            {user ? (
              <Link
                href="/profile"
                className="hidden items-center gap-2 text-sm text-[var(--varnarc-ink)] sm:inline-flex"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--varnarc-border)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--varnarc-accent)] text-xs font-semibold text-white">
                    {initials(user.displayName || user.email)}
                  </span>
                )}
                <span className="max-w-[120px] truncate">{user.displayName}</span>
              </Link>
            ) : authConfigured ? (
              <Link
                href="/auth/login"
                className="hidden items-center gap-2 text-sm text-[var(--varnarc-subtle)] sm:inline-flex"
              >
                <User className="h-4 w-4" />
                Login / Sign up
              </Link>
            ) : null}

            <button
              type="button"
              className="inline-flex rounded-md border border-[var(--varnarc-border)] p-2 text-[var(--varnarc-ink)] lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden bg-[var(--varnarc-brand)] lg:block">
        <div className="site-container flex h-11 items-center">
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-white" aria-label="Primary">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[12.5px] font-medium !text-white transition ${
                    active ? 'bg-white/15' : 'hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {open ? (
        <div className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] lg:hidden">
          <div className="site-container space-y-3 py-3">
            <HeaderSearch className="w-full md:hidden" />
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {items.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-[var(--varnarc-muted)] text-[var(--varnarc-accent)]'
                      : 'text-[var(--varnarc-ink)] hover:bg-[var(--varnarc-muted)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {!user && authConfigured ? (
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-[var(--varnarc-accent)] px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Login / Sign up
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
