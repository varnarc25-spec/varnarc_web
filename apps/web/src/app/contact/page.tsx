import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import { ContactExperience } from '@/features/contact/contact-experience';
import { ContactHelpLinks } from '@/features/contact/contact-help-links';
import { resolveContactTopic, sanitizePrefillPage } from '@/lib/contact';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: { absolute: 'Contact Varnarc | Support, Corrections & Partnerships' },
  description:
    'Contact Varnarc for general enquiries, content corrections, business partnerships, advertising or support. Choose the right contact option for your enquiry.',
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const envEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
  let publicContactEmail = envEmail;
  try {
    const settings = await apiPublicFetch<{ publicContactEmail?: string | null }>(
      '/settings/contact/public',
      { next: { revalidate: 60 } },
    );
    publicContactEmail = settings.data.publicContactEmail?.trim() || envEmail;
  } catch {
    publicContactEmail = envEmail;
  }
  const initialTopic =
    resolveContactTopic(params.type) || resolveContactTopic(params.topic) || 'general';
  const initialPageUrl = sanitizePrefillPage(params.page);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';

  return (
    <div className="bg-white text-slate-950">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Contact', url: `${siteUrl}/contact` },
        ])}
      />
      <div className="site-container pb-8 sm:pb-10">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 py-6 text-[13px] text-slate-500"
        >
          <Link href="/" className="transition hover:text-slate-900">
            Home
          </Link>
          <span aria-hidden>›</span>
          <span className="font-semibold text-slate-800">Contact</span>
        </nav>

        <header className="max-w-3xl pb-1 pt-1 sm:pt-2">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-blue-600">
            CONTACT VARNARC
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Contact Varnarc
          </h1>
          <p className="mt-3 text-lg font-bold text-slate-900 sm:text-xl">How can we help?</p>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
            Questions, feedback, corrections, support or business enquiries? Choose the right option
            below and we&apos;ll route your message to the appropriate team.
          </p>
        </header>

        <ContactExperience
          publicContactEmail={publicContactEmail}
          initialTopic={initialTopic}
          initialPageUrl={initialPageUrl}
        />

        <ContactHelpLinks />
      </div>
    </div>
  );
}
