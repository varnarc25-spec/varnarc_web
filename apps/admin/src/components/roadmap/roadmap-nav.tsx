import Link from 'next/link';

const links = [
  { href: '/roadmap', label: 'Overview' },
  { href: '/roadmap/releases', label: 'Releases' },
  { href: '/roadmap/milestones', label: 'Milestones' },
  { href: '/roadmap/backlog', label: 'Backlog' },
];

export function RoadmapNav({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            active === link.href
              ? 'font-medium text-[var(--varnarc-brand)]'
              : 'text-[var(--varnarc-subtle)] hover:text-[var(--varnarc-brand)] hover:underline'
          }
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
