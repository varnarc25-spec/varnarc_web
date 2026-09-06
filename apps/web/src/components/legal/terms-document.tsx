import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

const termsNavigation = [
  ['Eligibility', '1-eligibility'],
  ['About Varnarc', '2-about-varnarc'],
  ['Calculators', '4-calculators-estimates-and-data'],
  ['Finance', '5-financial-and-investment-information'],
  ['Construction', '6-construction-and-technical-information'],
  ['Automobiles', '7-automobile-and-product-information'],
  ['AI Features', '8-ai-assisted-features'],
  ['Accounts', '9-accounts'],
  ['User Content', '11-user-content'],
  ['Advertising', '16-advertising-sponsorships-and-affiliate-links'],
  ['Paid Services', '18-paid-services'],
  ['Liability', '22-limitation-of-liability'],
  ['Disputes', '27-dispute-resolution'],
  ['Contact', '30-contact'],
] as const;

function headingId(value: unknown) {
  const text = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  return text
    .toLowerCase()
    .replace(/&amp;|&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function looksLikeHtml(content: string) {
  return /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|table)\b/i.test(content);
}

function prepareHtml(content: string) {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attributes, inner) => {
      if (/\sid=/i.test(attributes)) return match;
      const text = inner.replace(/<[^>]+>/g, '');
      return `<h${level}${attributes} id="${headingId(text)}">${inner}</h${level}>`;
    });
}

function TermsNavigation() {
  const links = termsNavigation.map(([label, id]) => (
    <li key={id}>
      <a
        href={`#${id}`}
        className="flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
      >
        {label}
      </a>
    </li>
  ));

  return (
    <>
      <details className="rounded-xl border border-slate-200 bg-white p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-slate-700">
          On this page
        </summary>
        <ul className="mt-3 grid grid-cols-2 gap-1">{links}</ul>
      </details>

      <aside className="hidden lg:block">
        <nav
          aria-label="Terms of Service sections"
          className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4"
        >
          <h2 className="px-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            On this page
          </h2>
          <ul className="mt-3 space-y-1">{links}</ul>
        </nav>
      </aside>
    </>
  );
}

export function TermsDocument({
  title,
  description,
  content,
  effectiveDate,
  lastUpdated,
}: {
  title: string;
  description?: string;
  content: string;
  effectiveDate?: string;
  lastUpdated?: string;
}) {
  return (
    <main className="w-full bg-slate-50/40">
      <div className="site-container py-8 sm:py-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />

        <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
            Legal information
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-3xl">
            {title}
          </h1>
          {lastUpdated ? (
            <p className="mt-2 text-sm font-medium text-slate-500">Last updated: {lastUpdated}</p>
          ) : null}
          {effectiveDate && effectiveDate !== lastUpdated ? (
            <p className="mt-1 text-sm text-slate-500">Effective date: {effectiveDate}</p>
          ) : null}
          {description ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <TermsNavigation />

          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:text-[#0b1f3a] prose-a:text-blue-700 prose-li:marker:text-slate-400">
              {looksLikeHtml(content) ? (
                <div dangerouslySetInnerHTML={{ __html: prepareHtml(content) }} />
              ) : (
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
                    h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
                    a: ({ href, children }) =>
                      href?.startsWith('/') ? (
                        <Link href={href}>{children}</Link>
                      ) : (
                        <a href={href}>{children}</a>
                      ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
