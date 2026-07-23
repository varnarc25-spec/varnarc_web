import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { NewsletterUnsubscribeForm } from '@/features/newsletter/newsletter-unsubscribe-form';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  description: 'Unsubscribe from Varnarc newsletter emails.',
  robots: { index: false, follow: false },
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="site-container py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Newsletter', href: '/newsletter' },
          { label: 'Unsubscribe' },
        ]}
      />
      <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">Unsubscribe</h1>
      <p className="mt-2 text-[var(--varnarc-subtle)]">
        Enter your email to stop receiving newsletter messages from Varnarc.
      </p>
      <NewsletterUnsubscribeForm defaultEmail={email?.trim() ?? ''} />
    </main>
  );
}
