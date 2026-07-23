import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'About',
  description: 'About the Varnarc Platform.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Varnarc"
      description="Smart tools and expert guides for finance, home, automobiles, and everyday decisions."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
    >
      <div className="space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          Varnarc helps people plan better with calculators, reviews, comparisons, directories, and
          AI-assisted tools — all in one place.
        </p>
        <p>
          The platform is built on a modular Next.js frontend and versioned REST APIs, with CMS-driven
          homepage configuration when available.
        </p>
        <p>
          Editorial content is produced by our{' '}
          <a href="/authors/varnarc-editorial" className="font-medium text-[var(--varnarc-brand)] hover:underline">
            editorial team
          </a>
          .
        </p>
      </div>
    </PageShell>
  );
}
