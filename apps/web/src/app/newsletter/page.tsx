import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { NewsletterForm } from '@/features/newsletter/newsletter-form';

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Subscribe to Varnarc updates.',
};

export default function NewsletterPage() {
  return (
    <main className="site-container py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Newsletter' }]} />
      <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">Newsletter</h1>
      <p className="mt-2 text-[var(--varnarc-subtle)]">Product updates and useful guides, occasionally.</p>
      <div className="mt-8">
        <NewsletterForm source="newsletter-page" />
      </div>
      <p className="mt-6 text-sm text-[var(--varnarc-subtle)]">
        Already subscribed?{' '}
        <Link href="/newsletter/unsubscribe" className="text-[var(--varnarc-accent)] hover:underline">
          Unsubscribe
        </Link>
      </p>
    </main>
  );
}
