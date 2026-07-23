import Link from 'next/link';

const LINKS = [
  { href: '/ai-ops', label: 'Overview' },
  { href: '/ai-ops/settings', label: 'Settings' },
  { href: '/ai-ops/models', label: 'Models' },
  { href: '/ai-ops/prompts', label: 'Prompts' },
  { href: '/ai-ops/jobs', label: 'Jobs' },
  { href: '/ai-ops/summarizer', label: 'Summarizer' },
  { href: '/ai-ops/test', label: 'Test console' },
] as const;

export function AiOpsNav({ active }: { active: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            active === link.href
              ? 'rounded-full bg-[#f97316] px-3 py-1 font-medium text-white'
              : 'rounded-full border border-[var(--varnarc-border)] px-3 py-1 hover:border-[#f97316] hover:text-[#f97316]'
          }
        >
          {link.label}
        </Link>
      ))}
      <Link href="/articles" className="rounded-full border border-dashed border-[var(--varnarc-border)] px-3 py-1 text-[var(--varnarc-subtle)] hover:text-[#f97316]">
        Article AI panel →
      </Link>
    </nav>
  );
}
