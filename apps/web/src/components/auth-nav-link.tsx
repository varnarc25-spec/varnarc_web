import type { AnchorHTMLAttributes, ReactNode } from 'react';

/**
 * Full-page navigation for Auth0 routes.
 * Next.js <Link> prefetches /auth/login via fetch; Auth0 redirects cross-origin and CORS fails.
 */
export function AuthNavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
}) {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
