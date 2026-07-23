import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { ContactForm } from '@/features/contact/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Varnarc.',
};

export default function ContactPage() {
  return (
    <main className="site-container py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">Contact</h1>
      <p className="mt-2 text-[var(--varnarc-subtle)]">Send us a message. We will get back to you.</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </main>
  );
}
