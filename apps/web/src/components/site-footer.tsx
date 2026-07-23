'use client';

import Link from 'next/link';
import { NewsletterForm } from '@/features/newsletter/newsletter-form';
import { quickTools } from '@/features/home/static-data';

const defaultQuickLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

const helpfulLinks = [
  { href: '/articles', label: 'Blog' },
  { href: '/compare/products', label: 'Comparisons' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/directory', label: 'Directory' },
];

const resources = [
  { href: '/articles', label: 'Guides' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/ai-tools', label: 'AI Tools' },
  { href: '/developers', label: 'Developers' },
  { href: '/premium', label: 'Premium' },
  { href: '/contact', label: 'Support' },
];

export function SiteFooter({
  cmsLinks,
  siteName,
  tagline,
  copyright,
  logoUrl,
  socialLinks,
  newsletterEnabled = true,
  showAds = true,
}: {
  cmsLinks?: Array<{ label: string; href: string }>;
  siteName?: string | null;
  tagline?: string | null;
  copyright?: string | null;
  logoUrl?: string | null;
  socialLinks?: Array<{ label: string; href: string }> | null;
  newsletterEnabled?: boolean;
  showAds?: boolean;
}) {
  const popular = quickTools.slice(0, 5);
  const quickLinks = cmsLinks?.length ? cmsLinks : defaultQuickLinks;
  const brand = siteName?.trim() || 'Varnarc';
  const brandTagline =
    tagline?.trim() || 'Smart tools and expert guides to help you plan better and spend smarter.';
  const brandCopyright =
    copyright?.trim() || `© ${new Date().getFullYear()} Varnarc. All rights reserved.`;
  const social =
    socialLinks && socialLinks.length > 0
      ? socialLinks
      : [
          { label: 'F', href: 'https://facebook.com' },
          { label: 'T', href: 'https://twitter.com' },
          { label: 'I', href: 'https://instagram.com' },
          { label: 'Y', href: 'https://youtube.com' },
        ];

  return (
    <footer className="full-bleed mt-auto bg-[var(--vn-footer,#071428)] text-slate-300">
      <div className="site-container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <img
                src={logoUrl || '/brand/logo.png'}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-contain"
              />
              <span className="text-lg font-bold text-white">{brand}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{brandTagline}</p>
            <div className="mt-5 flex gap-3">
              {social.map((item) => (
                <a
                  key={item.href + item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold hover:bg-white/20"
                >
                  {item.label.slice(0, 1).toUpperCase()}
                </a>
              ))}
            </div>
            {newsletterEnabled ? (
              <NewsletterForm variant="compact" source="footer" />
            ) : null}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Popular Calculators</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {popular.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Helpful Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {helpfulLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {resources.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {showAds ? (
              <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                Ad placement area
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          {brandCopyright}
        </div>
      </div>
    </footer>
  );
}
