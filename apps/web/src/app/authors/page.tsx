import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';

export const metadata: Metadata = {
  title: 'Authors & reviewers',
  description:
    'Meet the Varnarc editorial team. Financial and construction content is reviewed against admin-published data and our editorial policy.',
  alternates: { canonical: '/authors' },
};

const PROFILES = [
  {
    href: '/authors/varnarc-editorial',
    name: 'Varnarc Editorial',
    role: 'Author',
    blurb:
      'Researches calculators, comparisons, and guides. Product numbers come from the admin catalog, not invented dashboards.',
  },
  {
    href: '/editorial-policy',
    name: 'Review process',
    role: 'Reviewer',
    blurb:
      'YMYL pages are checked against published rates, calculator formulas, and source notes. Corrections are logged publicly.',
  },
];

export default function AuthorsIndexPage() {
  return (
    <ContentLayout
      title="Authors & reviewers"
      description="Who writes and reviews Varnarc content, and where the numbers come from."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Authors' }]}
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {PROFILES.map((profile) => (
          <li key={profile.href}>
            <Link
              href={profile.href}
              className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {profile.role}
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#0b1f3a]">{profile.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{profile.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-slate-600">
        Individual bylines appear on articles when an author profile exists.{' '}
        <Link href="/editorial-policy" className="font-medium text-blue-700 hover:underline">
          Editorial policy
        </Link>
        {' · '}
        <Link href="/methodology" className="font-medium text-blue-700 hover:underline">
          Methodology
        </Link>
        {' · '}
        <Link href="/corrections" className="font-medium text-blue-700 hover:underline">
          Corrections
        </Link>
      </p>
    </ContentLayout>
  );
}
