import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  Car,
  Check,
  CheckCircle2,
  Code2,
  Eye,
  House,
  LockKeyhole,
  MapPin,
  PenTool,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  WalletCards,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Varnarc',
  description:
    'Learn about Varnarc, a platform for calculators, comparisons, guides, reviews, directories, and smart tools that help people make better everyday decisions.',
  alternates: { canonical: '/about' },
};

const bodySm = 'text-[13px] leading-5';

const capabilities = [
  {
    title: 'Calculate',
    description:
      'Use practical calculators for loans, investments, taxes, construction costs, solar and more.',
    icon: Calculator,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Compare',
    description: 'Compare products, services, rates, features and options before you decide.',
    icon: Scale,
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Research',
    description:
      'Read guides, reviews and explanations that make complex topics easier to understand.',
    icon: BookOpen,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Discover',
    description: 'Find businesses, professionals, products and services through discovery tools.',
    icon: MapPin,
    tone: 'bg-orange-50 text-orange-500',
  },
];

const journey = [
  {
    number: '01',
    title: 'Research',
    description: 'Understand your options with guides, reviews and useful information.',
    icon: Search,
    numberTone: 'bg-blue-600',
    iconTone: 'bg-blue-50 text-blue-600',
  },
  {
    number: '02',
    title: 'Calculate',
    description: 'Work out the numbers that matter using our smart calculators.',
    icon: Calculator,
    numberTone: 'bg-emerald-500',
    iconTone: 'bg-emerald-50 text-emerald-600',
  },
  {
    number: '03',
    title: 'Compare',
    description: 'Compare alternatives and choose the best fit for your needs.',
    icon: Scale,
    numberTone: 'bg-violet-500',
    iconTone: 'bg-violet-50 text-violet-600',
  },
  {
    number: '04',
    title: 'Decide',
    description: 'Make a more informed decision with clarity and confidence.',
    icon: CheckCircle2,
    numberTone: 'bg-orange-500',
    iconTone: 'bg-orange-50 text-orange-500',
  },
];

const categories = [
  {
    title: 'Finance',
    description: 'Loans, cards, investments, insurance, taxes & more.',
    href: '/finance',
    icon: WalletCards,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Home & Construction',
    description: 'Cost planning, construction tools, home resources and services.',
    href: '/home-construction',
    icon: House,
    tone: 'bg-orange-50 text-orange-500',
  },
  {
    title: 'Automobile',
    description: 'Vehicle research, ownership tools, financing and comparisons.',
    href: '/automobile',
    icon: Car,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Solar',
    description: 'Solar cost, savings, system planning and useful resources.',
    href: '/solar',
    icon: Sun,
    tone: 'bg-amber-50 text-amber-500',
  },
  {
    title: 'Calculators',
    description: 'Practical calculators for everyday financial and life decisions.',
    href: '/calculators',
    icon: Calculator,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'AI Tools',
    description: 'AI-assisted utilities that simplify research and planning.',
    href: '/ai-tools',
    icon: Sparkles,
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Directory',
    description: 'Find businesses and service providers near you.',
    href: '/directory',
    icon: MapPin,
    tone: 'bg-rose-50 text-rose-500',
  },
];

const principles = [
  {
    title: 'Useful over complicated',
    description: 'We turn complicated topics into simple, usable tools and explanations.',
    icon: ShieldCheck,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Transparent information',
    description: 'Important assumptions, sources and limitations are clearly explained.',
    icon: Eye,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Independent & objective',
    description: 'Editorial content is kept separate from commercial relationships.',
    icon: BadgeCheck,
    tone: 'bg-green-50 text-green-600',
  },
  {
    title: 'Privacy & security',
    description: 'We respect your privacy and work to protect personal information.',
    icon: LockKeyhole,
    tone: 'bg-amber-50 text-emerald-600',
  },
];

const companyLinks = [
  { label: 'Company information', href: '/about' },
  { label: 'Team', href: '#team' },
  { label: 'Editorial', href: '/authors/varnarc-editorial' },
  { label: 'Contact', href: '/contact?type=partnership' },
];

const commitmentLinks = [
  { label: 'Accuracy', href: '/finance/loans/methodology' },
  { label: 'Transparency', href: '/disclaimer' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Continuous improvement', href: '/contact?type=correction' },
];

const teams = [
  {
    title: 'Varnarc Editorial',
    description: 'Research & content',
    icon: BookOpen,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Product & Engineering',
    description: 'Tools & platform',
    icon: Code2,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Design',
    description: 'User experience',
    icon: PenTool,
    tone: 'bg-orange-50 text-orange-500',
  },
];

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`border-t border-slate-100 py-10 sm:py-12 ${className}`}>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="bg-white text-slate-950">
      <div className="site-container">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 py-6 text-[13px] text-slate-500"
        >
          <Link href="/" className="transition hover:text-slate-900">
            Home
          </Link>
          <span aria-hidden>›</span>
          <span className="font-semibold text-slate-800">About Varnarc</span>
        </nav>

        <section className="grid items-center gap-8 pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pb-14">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-blue-600">
              About Varnarc
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.35rem]">
              Smart tools. Clear information.{' '}
              <span className="text-blue-600">Better decisions.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Varnarc brings calculators, comparisons, guides, reviews, directories and AI-assisted
              tools together in one platform. Our mission is to simplify research and help you make
              confident, well-informed decisions every day.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#explore"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700"
              >
                Explore Varnarc <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/calculators"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Explore Calculators <Calculator className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-8 -z-10 rounded-full bg-blue-100/50 blur-3xl" />
            <img
              src="/about/hero-dashboard.png"
              alt="Varnarc platform dashboard showing finance, construction, automobile and solar decision tools"
              className="mx-auto w-full max-w-[650px]"
            />
          </div>
        </section>
      </div>

      <Section>
        <div className="site-container">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-950">
            What Varnarc helps you do
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                      <p className={`mt-2 ${bodySm} text-slate-600`}>{item.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <Section>
        <div className="site-container grid gap-8 lg:grid-cols-[300px_1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-blue-600">
              Why we built Varnarc
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-950">
              Built around the way you make decisions.
            </h2>
            <p className={`mt-4 ${bodySm} leading-6 text-slate-600`}>
              Important decisions usually follow a journey. Varnarc is built to support you at every
              step.
            </p>
            <div className={`mt-5 space-y-3 ${bodySm} text-slate-700`}>
              {[
                ['Less searching.', 'Everything in one place.'],
                ['More clarity.', 'Tools and information that are easy to use.'],
                ['Better decisions.', 'Evaluate options with confidence.'],
              ].map(([strong, rest]) => (
                <div key={strong} className="flex gap-2">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span>
                    <strong>{strong}</strong> {rest}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-200 bg-white px-4 py-5 sm:px-6">
            <div className="absolute left-[13%] right-[13%] top-[35px] hidden border-t border-slate-200 sm:block" />
            <div className="grid gap-7 sm:grid-cols-4 sm:gap-3">
              {journey.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.number} className="relative text-center">
                    <div
                      className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold text-white ${item.numberTone}`}
                    >
                      {item.number}
                    </div>
                    <div
                      className={`mx-auto mt-4 grid h-12 w-12 place-items-center rounded-full ${item.iconTone}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-950">{item.title}</h3>
                    <p className={`mx-auto mt-2 max-w-[170px] ${bodySm} text-slate-500`}>
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section id="explore" className="scroll-mt-24">
        <div className="site-container">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-6 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight">Explore Varnarc</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
              {categories.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group relative min-h-[170px] rounded-xl border border-slate-200 bg-white px-4 py-5 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div
                      className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${item.tone}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold leading-4 text-slate-950">
                      {item.title}
                    </h3>
                    <p className={`mt-2 ${bodySm} text-slate-500`}>{item.description}</p>
                    <span className="absolute bottom-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-blue-600 transition group-hover:translate-x-0.5">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="site-container">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/70 px-5 py-7 sm:px-7 sm:py-8">
            <h2 className="text-center text-xl font-bold">Our principles</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
              {principles.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`flex gap-3 xl:px-6 ${index < principles.length - 1 ? 'xl:border-r xl:border-slate-200' : ''}`}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{item.title}</h3>
                      <p className={`mt-1.5 ${bodySm} text-slate-600`}>{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="site-container grid gap-4 lg:grid-cols-2">
          <article className="grid items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[150px_1fr] sm:p-6">
            <img
              src="/about/editorial-standards.png"
              alt="Editorial standards illustration"
              className="mx-auto w-full max-w-[170px]"
            />
            <div>
              <h2 className="text-xl font-bold">Editorial standards</h2>
              <p className={`mt-3 ${bodySm} text-slate-600`}>
                Our editorial team creates content that is accurate, helpful and easy to understand.
                We follow a clear process for research, review and updates.
              </p>
              <div className={`mt-3 space-y-1.5 ${bodySm} text-slate-600`}>
                {[
                  'Researched using relevant sources and subject expertise',
                  'Reviewed, fact-checked and updated where needed',
                  'Corrections are handled transparently',
                ].map((text) => (
                  <p key={text} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {text}
                  </p>
                ))}
              </div>
              <Link
                href="/authors/varnarc-editorial"
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
              >
                Meet our editorial team <Users className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>

          <article className="grid items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_150px] sm:p-6">
            <div>
              <h2 className="text-xl font-bold">How Varnarc may make money</h2>
              <p className={`mt-3 ${bodySm} text-slate-600`}>
                Varnarc may earn revenue through advertising, premium products, partnerships,
                referrals, sponsored placements and provider listings.
              </p>
              <div className={`mt-3 space-y-1.5 ${bodySm} text-slate-600`}>
                {[
                  'Commercial relationships should be clearly disclosed',
                  'Commercial arrangements should not determine editorial conclusions',
                  'User trust and experience remain important',
                ].map((text) => (
                  <p key={text} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {text}
                  </p>
                ))}
              </div>
              <Link
                href="/disclaimer"
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
              >
                Learn more about our policies <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <img
              src="/about/revenue-transparency.png"
              alt="Revenue transparency illustration"
              className="mx-auto w-full max-w-[170px]"
            />
          </article>
        </div>
      </Section>

      <Section>
        <div className="site-container">
          <div className="grid items-center gap-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:grid-cols-[52px_1fr_auto] sm:px-7">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-500">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Information, not personalized advice</h2>
              <p className={`mt-1.5 ${bodySm} text-slate-600`}>
                Varnarc provides general information, calculators, comparisons and research tools.
                Results may be estimates and information can change. Verify important details with
                the relevant provider or a qualified professional before making financial, legal,
                tax or other significant decisions.
              </p>
            </div>
            <Link
              href="/disclaimer"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
            >
              Read our disclaimer
            </Link>
          </div>
        </div>
      </Section>

      <Section>
        <div className="site-container grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-bold">Built by Varnarc</h2>
            <p className={`mt-2 ${bodySm} text-slate-600`}>
              Company information, the people behind the platform, editorial work and how to reach
              us.
            </p>
            <ul className="mt-5 divide-y divide-slate-100">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between py-2.5 text-[13px] font-semibold text-slate-700 transition hover:text-blue-600"
                  >
                    {item.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-bold">Our commitment</h2>
            <p className={`mt-2 ${bodySm} text-slate-600`}>
              Accuracy, transparency, privacy and continuous improvement guide how we build Varnarc.
            </p>
            <ul className="mt-5 divide-y divide-slate-100">
              {commitmentLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between py-2.5 text-[13px] font-semibold text-slate-700 transition hover:text-blue-600"
                  >
                    {item.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <Section id="team" className="scroll-mt-24">
        <div className="site-container">
          <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:p-8">
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-xl font-bold sm:text-2xl">The people behind Varnarc</h2>
              <p className={`mt-2 max-w-xl ${bodySm} text-slate-600`}>
                Writers, researchers, engineers and designers working together to build a platform
                that helps people make clearer decisions.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {teams.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className={`grid h-10 w-10 place-items-center rounded-lg ${item.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-slate-950">{item.title}</h3>
                      <p className={`mt-1 ${bodySm} text-slate-500`}>{item.description}</p>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/authors/varnarc-editorial"
                className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
              >
                Meet our editorial team <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <img
              src="/about/team-map.svg"
              alt=""
              className="pointer-events-none absolute bottom-0 right-0 hidden w-[32%] opacity-80 lg:block"
            />
          </article>
        </div>
      </Section>

      <div className="site-container pb-8">
        <section className="grid min-h-[170px] items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#061b39] to-[#0c315d] px-6 py-6 text-white sm:px-8 lg:grid-cols-[1fr_auto_360px]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-blue-300">
              Get started
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight">
              Make your next decision
              <br />
              with better information.
            </h2>
            <p className={`mt-2 max-w-md ${bodySm} text-slate-200`}>
              Explore calculators, comparisons, guides, reviews and tools across Varnarc.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-3 text-[13px] font-extrabold text-white transition hover:bg-orange-600"
          >
            Explore Varnarc <ArrowRight className="h-4 w-4" />
          </Link>
          <img
            src="/about/cta-illustration.svg"
            alt="Varnarc workspace illustration"
            className="hidden w-full max-w-[360px] lg:block"
          />
        </section>

        <div
          className={`grid grid-cols-2 gap-y-5 py-6 text-center ${bodySm} font-medium text-slate-600 sm:grid-cols-4`}
        >
          <div className="px-3 sm:border-r sm:border-slate-200">
            <Users className="mx-auto mb-1.5 h-[18px] w-[18px] text-slate-700" />
            Designed for everyday users
          </div>
          <div className="px-3 sm:border-r sm:border-slate-200">
            <ShieldCheck className="mx-auto mb-1.5 h-[18px] w-[18px] text-slate-700" />
            Secure & private by design
          </div>
          <div className="px-3 sm:border-r sm:border-slate-200">
            <Sun className="mx-auto mb-1.5 h-[18px] w-[18px] text-slate-700" />
            Regularly updated information
          </div>
          <div className="px-3">
            <BadgeCheck className="mx-auto mb-1.5 h-[18px] w-[18px] text-slate-700" />
            Committed to clarity & trust
          </div>
        </div>
      </div>
    </main>
  );
}
