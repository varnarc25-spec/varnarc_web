'use client';

import Link from 'next/link';
import { FormEvent, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Calculator,
  Car,
  IndianRupee,
  Mail,
  Search,
  Shield,
  Star,
} from 'lucide-react';
import { NewsletterForm } from '@/features/newsletter/newsletter-form';
import { HomeIcon } from '@/features/home/home-icons';
import { categories, heroBg, professionals } from '@/features/home/static-data';
import type {
  ClassicArticleCard,
  ClassicCalculatorTile,
  ClassicComparisonCard,
  ClassicReviewCard,
} from '@/features/home/classic-home-mappers';

export function ClassicSectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-[#f97316] hover:underline">
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ClassicStars({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${score} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < full ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
        />
      ))}
      <span className="text-xs font-semibold text-slate-900">{score.toFixed(1)}</span>
    </span>
  );
}

export function ClassicHeroSection({ popularTerms }: { popularTerms: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  return (
    <section className="bg-white">
      <div className="site-container py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="text-left">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0b1f3a] sm:text-3xl md:text-4xl">
              Your All-in-One Platform for{' '}
              <span className="text-[#f97316]">Finance, Home, Automobiles</span> &amp; Smart Tools
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Calculators, Guides, Product Reviews and Expert Advice to make your life simpler and smarter.
            </p>
            <form onSubmit={onSubmit} className="mt-5 w-full" role="search">
              <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-1 items-center gap-2 px-4">
                    <Search className="h-4 w-4 text-slate-400" aria-hidden />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="What are you looking for?"
                      className="h-12 w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      autoComplete="off"
                    />
                  </div>
                  <button type="submit" className="h-12 shrink-0 bg-[#f97316] px-7 text-sm font-semibold text-white hover:bg-[#ea580c]">
                    Search
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">Popular Searches:</span>
                  {popularTerms.map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#f97316] hover:text-[#f97316]"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            </form>
          </div>
          <div className="relative mx-auto h-[260px] w-full max-w-lg sm:h-[300px] md:h-[330px] lg:h-[360px]">
            <div
              className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(ellipse_at_center,#ffedd5_0%,#fff7ed_45%,transparent_70%)]"
              aria-hidden
            />
            <img
              src={heroBg}
              alt="Modern home"
              className="absolute inset-0 h-full w-full object-contain object-center [mask-image:radial-gradient(ellipse_75%_70%_at_55%_50%,black_45%,transparent_78%)] [-webkit-mask-image:radial-gradient(ellipse_75%_70%_at_55%_50%,black_45%,transparent_78%)]"
            />
            <span className="absolute left-1 top-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0b1f3a] shadow-lg sm:left-3 sm:h-12 sm:w-12">
              <IndianRupee className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="absolute bottom-12 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#f97316] shadow-lg sm:left-8 sm:h-12 sm:w-12">
              <Calculator className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="absolute right-1 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#f5a623] shadow-lg sm:right-3 sm:h-11 sm:w-11">
              <Building2 className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="absolute bottom-8 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#ea580c] shadow-lg sm:right-6">
              <Car className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalculatorTile({ name, href, color, icon }: ClassicCalculatorTile) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-3 transition hover:-translate-y-0.5 hover:shadow-sm sm:py-4"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: color }}>
        <HomeIcon name={icon} className="h-6 w-6 text-white" />
      </div>
      <div className="mt-2 line-clamp-2 text-center text-[11px] font-semibold text-slate-700 group-hover:text-[#f97316]">
        {name}
      </div>
    </Link>
  );
}

export function ClassicCalculatorsSection({
  title,
  tiles,
}: {
  title: string;
  tiles: ClassicCalculatorTile[];
}) {
  return (
    <section className="bg-[#f8fafc] py-6 sm:py-8">
      <div className="site-container">
        <ClassicSectionHead title={title} href="/calculators" linkLabel="View all calculators" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 md:grid-cols-10">
          {tiles.map((t) => (
            <CalculatorTile key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClassicCategoriesSection({ title }: { title: string }) {
  return (
    <section className="py-6 sm:py-8">
      <div className="site-container">
        <ClassicSectionHead title={title} href="/finance" linkLabel="View all categories" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((cat) => (
            <div key={cat.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: cat.accentSoft, color: cat.accent }}
                    >
                      <HomeIcon name={cat.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-extrabold" style={{ color: cat.accent }}>
                      {cat.title}
                    </h3>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {cat.links.slice(0, 6).map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="text-[12px] font-medium text-slate-600 hover:text-[#f97316] hover:underline">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <img src={cat.image} alt="" className="h-24 w-24 rounded-xl object-cover" />
              </div>
              <div className="mt-4 flex items-center justify-end">
                <Link
                  href={cat.href}
                  className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: cat.accent }}
                >
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClassicArticlesSection({
  title,
  articles,
}: {
  title: string;
  articles: ClassicArticleCard[];
}) {
  return (
    <section className="bg-[#f8fafc] py-6 sm:py-8">
      <div className="site-container">
        <ClassicSectionHead title={title} href="/articles" linkLabel="View all articles" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {articles.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <img src={a.image} alt="" className="h-24 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
              <div className="p-3">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#f97316]">{a.category}</div>
                <div className="mt-2 line-clamp-2 text-[12px] font-semibold text-slate-900 group-hover:text-[#f97316]">
                  {a.title}
                </div>
                {a.date ? <div className="mt-1 text-[10px] font-medium text-slate-500">{a.date}</div> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClassicAiToolsSection({
  title,
  tiles,
}: {
  title: string;
  tiles: Array<{ name: string; href: string; color: string; icon: string }>;
}) {
  return (
    <section className="py-6 sm:py-8">
      <div className="site-container">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">{title}</h2>
          <Link href="/ai-tools" className="inline-flex items-center gap-1 text-sm font-semibold text-[#f97316] hover:underline">
            View all tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
          {tiles.map((t) => (
            <Link
              key={t.name}
              href={t.href}
              className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-4 transition hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: t.color }}>
                <HomeIcon name={t.icon} className="h-5 w-5 text-white" />
              </div>
              <div className="mt-2 line-clamp-2 text-center text-[11px] font-medium text-slate-700 group-hover:text-[#f97316]">
                {t.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClassicTripleColumnSection({
  comparisons,
  reviews,
}: {
  comparisons: ClassicComparisonCard[];
  reviews: ClassicReviewCard[];
}) {
  return (
    <section className="bg-[#f8fafc] py-6 sm:py-8">
      <div className="site-container">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ClassicSectionHead title="Compare & Decide Better" href="/compare/products" linkLabel="View all comparisons" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {comparisons.map((c) => (
                <Link key={c.href} href={c.href} className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:shadow-sm">
                  <div className="relative mb-2 flex items-center justify-center gap-1">
                    <img src={c.leftImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0f172a] px-2 py-0.5 text-[10px] font-bold text-white">
                      VS
                    </span>
                    <img src={c.rightImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  </div>
                  <div className="line-clamp-2 text-center text-[11px] font-semibold text-[#0f172a]">{c.title}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ClassicSectionHead title="Top Product Reviews" href="/reviews" linkLabel="View all reviews" />
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="flex gap-3 rounded-xl p-2 transition hover:bg-slate-50 hover:shadow-sm">
                    <img src={r.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-[12px] font-semibold text-slate-900">{r.title}</div>
                      <div className="mt-1">
                        <ClassicStars score={r.score} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ClassicSectionHead title="Find Professionals" href="/directory" linkLabel="View all" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {professionals.slice(0, 8).map((p) => (
                <Link
                  key={p.name}
                  href={p.href}
                  className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2.5 text-center transition hover:bg-white hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#f97316]">
                    <HomeIcon name={p.icon} className="h-4 w-4" />
                  </span>
                  <span className="whitespace-nowrap text-[11px] font-semibold text-slate-900">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({ icon, color, title, subtitle }: { icon: ReactNode; color: string; title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${color}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="whitespace-nowrap text-[13px] font-bold text-[#0b1f3a]">{title}</div>
        <div className="whitespace-nowrap text-[11px] text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

export function ClassicTrustNewsletterSection() {
  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="site-container">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl bg-[#eef1f5] px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid w-full grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
              <TrustItem
                icon={<BadgeCheck className="h-5 w-5" strokeWidth={2.5} />}
                color="bg-[#22c55e]"
                title="Trusted & Updated"
                subtitle="Expert verified content"
              />
              <TrustItem
                icon={<Calculator className="h-5 w-5" strokeWidth={2.25} />}
                color="bg-[#38bdf8]"
                title="Free Calculators"
                subtitle="100+ free tools to use"
              />
              <TrustItem
                icon={<Shield className="h-5 w-5" strokeWidth={2.25} />}
                color="bg-[#f5a623]"
                title="Save Time & Money"
                subtitle="Helpful guides & ideas"
              />
              <TrustItem
                icon={<Award className="h-5 w-5" strokeWidth={2.25} />}
                color="bg-[#0b1f3a]"
                title="Unbiased Reviews"
                subtitle="Find the best for you"
              />
            </div>
          </div>
          <div className="flex w-full shrink-0 items-start gap-3 rounded-2xl bg-[#eef1f5] px-5 py-5 sm:px-6 sm:py-6 lg:w-[360px]">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-extrabold tracking-tight text-[#0b1f3a]">Subscribe to Newsletter</h2>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">
                Get helpful tips, latest articles and tools delivered to your inbox.
              </p>
              <NewsletterForm variant="inline" source="homepage" className="mt-3 w-full" />
            </div>
            <span className="mt-1 hidden h-14 w-14 shrink-0 items-center justify-center text-[#38bdf8] sm:inline-flex">
              <Mail className="h-10 w-10" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
