import { MessageSquare, Search, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    title: 'Search',
    description: 'Tell us the service and location you need.',
    icon: Search,
  },
  {
    n: '02',
    title: 'Evaluate',
    description: 'Review provider details, credentials and available ratings.',
    icon: ShieldCheck,
  },
  {
    n: '03',
    title: 'Contact',
    description: 'Connect directly or request a quote where available.',
    icon: MessageSquare,
  },
] as const;

export function DirectoryHowItWorks() {
  return (
    <section
      aria-labelledby="directory-how-heading"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0b1f3a] via-slate-900 to-emerald-950 px-5 py-8 text-white sm:px-8 sm:py-10"
    >
      <h2 id="directory-how-heading" className="text-2xl font-extrabold tracking-tight">
        How Varnarc Directory works
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
        A simple path from need to contact — built around service, location and provider details.
      </p>

      <ol className="relative mt-8 grid gap-6 md:grid-cols-3 md:gap-4">
        <div
          className="pointer-events-none absolute left-[16%] right-[16%] top-[2.25rem] hidden h-px bg-gradient-to-r from-emerald-400/0 via-emerald-300/50 to-emerald-400/0 md:block"
          aria-hidden
        />
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.n}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-200">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[12px] font-extrabold tracking-[0.16em] text-emerald-300">
                  {step.n}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
