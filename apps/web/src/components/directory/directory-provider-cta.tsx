import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function DirectoryProviderCta() {
  return (
    <section
      aria-labelledby="directory-provider-cta-heading"
      className="rounded-3xl border border-slate-200 bg-white px-5 py-8 sm:px-8"
    >
      <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
        For service providers
      </p>
      <h2
        id="directory-provider-cta-heading"
        className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
      >
        Are you a service provider?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
        Create or claim your Varnarc business profile and help customers discover your services.
        Self-serve onboarding is coming — for now, tell us about your business and we will follow
        up.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/contact?type=listing"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1f3a] px-5 text-sm font-bold text-white hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
        >
          List your business
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/contact?type=provider"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
        >
          Claim your business
        </Link>
      </div>
    </section>
  );
}
