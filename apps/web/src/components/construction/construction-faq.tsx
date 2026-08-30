'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { ConstructionFaqItem } from '@/components/construction/types';
import { ConstructionSection } from '@/components/construction/construction-section';

export function ConstructionFAQ({
  faqs,
  title = 'Frequently asked questions',
  viewAllHref,
  viewAllLabel = 'View all FAQs →',
}: {
  faqs: ConstructionFaqItem[];
  title?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (!faqs.length) return null;

  return (
    <ConstructionSection
      id="construction-faq"
      title={title}
      action={viewAllHref ? { href: viewAllHref, label: viewAllLabel } : undefined}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="group rounded-xl bg-white ring-1 ring-slate-200/80 transition open:ring-[#0b1f3a]/20 motion-reduce:transition-none"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold text-[#0b1f3a] sm:text-[0.9375rem]">
                {faq.question}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden
              />
            </summary>
            <div className="border-t border-slate-100 px-4 pb-4 pt-2 sm:px-5">
              <p className="max-w-prose text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>
      {viewAllHref ? (
        <p className="mt-4 md:hidden">
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-[#0b1f3a] hover:text-[#f97316]"
          >
            {viewAllLabel}
          </Link>
        </p>
      ) : null}
    </ConstructionSection>
  );
}
