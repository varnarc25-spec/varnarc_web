import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Info, ShieldCheck } from 'lucide-react';
import { ContactExperience } from '@/features/contact/contact-experience';
import { resolveContactTopic, sanitizePrefillPage } from '@/lib/contact';
import { apiPublicFetch } from '@/services/api-client';

export const metadata: Metadata = {
  title: 'Contact Varnarc | Support, Feedback & Business Enquiries',
  description:
    'Contact Varnarc for general enquiries, support, content corrections, business listings, partnerships and other questions.',
  alternates: { canonical: '/contact' },
};

const quickLinks = [
  { href: '/about', label: 'About Varnarc', icon: Info },
  { href: '/authors/varnarc-editorial', label: 'Editorial standards', icon: BookOpenCheck },
  { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { href: '/disclaimer', label: 'Disclaimer', icon: Info },
];

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

  return (
    <main className="bg-white text-slate-950">
      <div className="site-container pb-10">
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

        <header className="max-w-2xl pb-2">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-blue-600">
            Contact Varnarc
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Questions, feedback, corrections or business enquiries? Choose the right option below or
            send us a message.
          </p>
        </header>

        <ContactExperience
          publicContactEmail={publicContactEmail}
          initialTopic={initialTopic}
          initialPageUrl={initialPageUrl}
        />

        <section className="mt-10 border-t border-slate-100 pt-8">
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
            You may find your answer here
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                    {item.label}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-slate-400 transition motion-safe:group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
