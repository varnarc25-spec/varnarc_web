import type { ReactNode } from 'react';

const TONE_CLASS = {
  white: 'bg-white',
  /** Very light gray — uses canvas token */
  muted: 'bg-[var(--varnarc-bg,#f7f8fb)]',
  /** Soft navy/gray tint — unsaturated */
  navy: 'bg-[#e8eef5]/45',
} as const;

const PAD_CLASS = {
  /** Landmark sections: ~40–56 mobile, ~64–80 desktop */
  major: 'py-10 sm:py-12 lg:py-16',
  /** Nested educational rhythm: slightly tighter so the page stays compact */
  compact: 'py-8 sm:py-10 lg:py-12',
} as const;

export type LoanSectionTone = keyof typeof TONE_CLASS;
export type LoanSectionPad = keyof typeof PAD_CLASS;

/**
 * Full-bleed background band for loans hub visual rhythm.
 * Content stays in `site-container`; backgrounds do not use saturated color.
 */
export function LoanSectionBand({
  tone = 'white',
  pad = 'major',
  children,
  className = '',
  id,
  'aria-labelledby': ariaLabelledBy,
}: {
  tone?: LoanSectionTone;
  pad?: LoanSectionPad;
  children: ReactNode;
  className?: string;
  id?: string;
  'aria-labelledby'?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`full-bleed ${TONE_CLASS[tone]} ${className}`}
    >
      <div className={`site-container px-4 ${PAD_CLASS[pad]}`}>{children}</div>
    </section>
  );
}
