import type { ReactNode } from 'react';
import {
  CALCULATOR_ILLUSTRATION_HEIGHT,
  CALCULATOR_ILLUSTRATION_WIDTH,
  calculatorIllustrationSrc,
  illustrationTypeForCalculatorSlug,
  type CalculatorIllustrationType,
} from '@/lib/calculator-illustrations';

const LABEL: Record<CalculatorIllustrationType, string> = {
  car: 'Car and EMI planner illustration',
  fuel: 'Fuel cost illustration',
  mileage: 'Mileage illustration',
  insurance: 'Insurance illustration',
  depreciation: 'Depreciation illustration',
  maintenance: 'Maintenance illustration',
  ev: 'Electric vehicle illustration',
  emi: 'Loan EMI illustration',
  sip: 'Investment illustration',
  tax: 'Tax illustration',
  construction: 'Home and construction illustration',
  generic: 'Calculator illustration',
};

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${CALCULATOR_ILLUSTRATION_WIDTH} ${CALCULATOR_ILLUSTRATION_HEIGHT}`}
      width={CALCULATOR_ILLUSTRATION_WIDTH}
      height={CALCULATOR_ILLUSTRATION_HEIGHT}
      fill="none"
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-[280px]"
    >
      <rect width="480" height="360" rx="28" fill="#f7f9fc" />
      <circle cx="64" cy="80" r="48" fill="#e8eef5" opacity="0.7" />
      <circle cx="408" cy="300" r="50" fill="#ffedd5" opacity="0.45" />
      {children}
    </svg>
  );
}

function TypeArt({ type }: { type: CalculatorIllustrationType }) {
  const label = LABEL[type];
  if (type === 'car') {
    return (
      <Frame label={label}>
        <path d="M74 198h48l28-40h110l32 40h54v44H74v-44z" fill="#0b1f3a" />
        <path d="M140 158h96l22 32H124l16-32z" fill="#163255" />
        <rect x="148" y="168" width="36" height="18" rx="4" fill="#e8eef5" opacity="0.35" />
        <circle cx="128" cy="244" r="22" fill="#122b4a" />
        <circle cx="278" cy="244" r="22" fill="#122b4a" />
        <circle cx="318" cy="210" r="5" fill="#f97316" />
        <rect x="318" y="64" width="116" height="148" rx="14" fill="#fff" stroke="#e2e8f0" />
        <rect x="338" y="88" width="76" height="9" rx="4.5" fill="#0b1f3a" opacity="0.8" />
        <rect x="338" y="110" width="58" height="7" rx="3.5" fill="#94a3b8" opacity="0.4" />
        <rect x="338" y="160" width="52" height="22" rx="7" fill="#fff4eb" />
        <rect x="348" y="167" width="32" height="8" rx="4" fill="#f97316" opacity="0.85" />
      </Frame>
    );
  }
  if (type === 'fuel') {
    return (
      <Frame label={label}>
        <rect x="150" y="88" width="88" height="168" rx="16" fill="#0b1f3a" />
        <rect x="166" y="108" width="56" height="72" rx="8" fill="#38bdf8" opacity="0.35" />
        <path d="M238 140h36c12 0 22 10 22 22v78" stroke="#f97316" strokeWidth="10" fill="none" />
        <circle cx="296" cy="248" r="14" fill="#f97316" />
        <rect x="88" y="278" width="248" height="40" rx="12" fill="#fff" stroke="#e2e8f0" />
        <rect x="108" y="292" width="120" height="12" rx="6" fill="#0b1f3a" opacity="0.75" />
      </Frame>
    );
  }
  if (type === 'mileage') {
    return (
      <Frame label={label}>
        <circle cx="220" cy="170" r="88" fill="#fff" stroke="#e2e8f0" strokeWidth="8" />
        <path d="M160 198a72 72 0 0 1 120-8" stroke="#0b1f3a" strokeWidth="10" fill="none" />
        <path d="M220 170l48-40" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />
        <circle cx="220" cy="170" r="8" fill="#0b1f3a" />
        <text x="206" y="268" fill="#0b1f3a" fontSize="18" fontWeight="700" fontFamily="system-ui">
          km/l
        </text>
      </Frame>
    );
  }
  if (type === 'insurance') {
    return (
      <Frame label={label}>
        <path d="M240 72l92 36v70c0 52-36 88-92 110-56-22-92-58-92-110V108l92-36z" fill="#0b1f3a" />
        <path
          d="M208 178l24 24 48-56"
          stroke="#f97316"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
      </Frame>
    );
  }
  if (type === 'depreciation') {
    return (
      <Frame label={label}>
        <rect x="88" y="72" width="304" height="216" rx="18" fill="#fff" stroke="#e2e8f0" />
        <path
          d="M120 220 L180 160 L240 188 L320 108"
          stroke="#f97316"
          strokeWidth="8"
          fill="none"
        />
        <circle cx="320" cy="108" r="8" fill="#0b1f3a" />
        <rect x="120" y="248" width="40" height="16" rx="4" fill="#cbd5e1" />
        <rect x="180" y="236" width="40" height="28" rx="4" fill="#94a3b8" />
        <rect x="240" y="220" width="40" height="44" rx="4" fill="#64748b" />
        <rect x="300" y="200" width="40" height="64" rx="4" fill="#0b1f3a" />
      </Frame>
    );
  }
  if (type === 'maintenance') {
    return (
      <Frame label={label}>
        <circle cx="200" cy="170" r="70" fill="#0b1f3a" />
        <path d="M200 118v36M164 170h36" stroke="#e8eef5" strokeWidth="10" />
        <rect
          x="268"
          y="128"
          width="96"
          height="16"
          rx="8"
          transform="rotate(28 268 128)"
          fill="#f97316"
        />
        <rect x="88" y="268" width="220" height="36" rx="12" fill="#fff" stroke="#e2e8f0" />
      </Frame>
    );
  }
  if (type === 'ev') {
    return (
      <Frame label={label}>
        <path d="M90 210h52l24-36h96l28 36h48v40H90v-40z" fill="#0b1f3a" />
        <path d="M168 174h72l18 28H154l14-28z" fill="#163255" />
        <circle cx="148" cy="252" r="20" fill="#122b4a" />
        <circle cx="268" cy="252" r="20" fill="#122b4a" />
        <path d="M320 96l28 48h-22l18 40-48-52h24l-18-36h18z" fill="#f97316" />
      </Frame>
    );
  }
  if (type === 'emi') {
    return (
      <Frame label={label}>
        <rect x="96" y="80" width="288" height="200" rx="20" fill="#fff" stroke="#e2e8f0" />
        <rect x="120" y="108" width="160" height="14" rx="7" fill="#0b1f3a" />
        <rect x="120" y="140" width="240" height="10" rx="5" fill="#cbd5e1" />
        <rect x="120" y="168" width="200" height="10" rx="5" fill="#cbd5e1" />
        <rect x="120" y="208" width="88" height="36" rx="10" fill="#fff4eb" />
        <rect x="136" y="218" width="56" height="16" rx="8" fill="#f97316" />
      </Frame>
    );
  }
  if (type === 'sip') {
    return (
      <Frame label={label}>
        <rect x="110" y="220" width="36" height="60" rx="6" fill="#94a3b8" />
        <rect x="162" y="180" width="36" height="100" rx="6" fill="#64748b" />
        <rect x="214" y="140" width="36" height="140" rx="6" fill="#0b1f3a" />
        <rect x="266" y="100" width="36" height="180" rx="6" fill="#163255" />
        <rect x="318" y="72" width="36" height="208" rx="6" fill="#f97316" />
      </Frame>
    );
  }
  if (type === 'tax') {
    return (
      <Frame label={label}>
        <rect x="140" y="72" width="200" height="216" rx="16" fill="#fff" stroke="#e2e8f0" />
        <rect x="164" y="100" width="152" height="12" rx="6" fill="#0b1f3a" />
        <rect x="164" y="132" width="120" height="8" rx="4" fill="#cbd5e1" />
        <rect x="164" y="156" width="132" height="8" rx="4" fill="#cbd5e1" />
        <rect x="164" y="200" width="80" height="28" rx="8" fill="#fff4eb" />
        <text x="176" y="220" fill="#f97316" fontSize="16" fontWeight="700" fontFamily="system-ui">
          %
        </text>
      </Frame>
    );
  }
  if (type === 'construction') {
    return (
      <Frame label={label}>
        <path d="M80 240 L240 88 L400 240" fill="#0b1f3a" />
        <rect x="140" y="200" width="200" height="80" fill="#163255" />
        <rect x="220" y="228" width="40" height="52" fill="#f7f9fc" />
        <rect x="164" y="216" width="32" height="24" fill="#e8eef5" opacity="0.4" />
        <rect x="284" y="216" width="32" height="24" fill="#e8eef5" opacity="0.4" />
        <rect x="88" y="280" width="48" height="16" rx="4" fill="#f97316" />
      </Frame>
    );
  }
  return (
    <Frame label={label}>
      <rect x="148" y="88" width="184" height="196" rx="24" fill="#0b1f3a" />
      <rect x="172" y="112" width="136" height="48" rx="10" fill="#163255" />
      <circle cx="196" cy="200" r="14" fill="#e8eef5" opacity="0.35" />
      <circle cx="240" cy="200" r="14" fill="#f97316" />
      <circle cx="284" cy="200" r="14" fill="#e8eef5" opacity="0.35" />
      <rect x="184" y="232" width="112" height="20" rx="10" fill="#fff4eb" />
    </Frame>
  );
}

export function CalculatorHeroIllustration({
  slug,
  src,
  alt,
  displayWidth,
}: {
  slug: string;
  /** Uploaded illustration from admin (preferred over built-in SVG art). */
  src?: string | null;
  alt?: string | null;
  displayWidth?: number | null;
}) {
  const custom = (src?.trim() || calculatorIllustrationSrc(slug) || '').trim() || null;
  const type = illustrationTypeForCalculatorSlug(slug);
  if (custom) {
    const width = Math.min(800, Math.max(120, displayWidth ?? 380));
    return (
      <img
        src={custom}
        alt={alt?.trim() || LABEL[type]}
        width={CALCULATOR_ILLUSTRATION_WIDTH}
        height={CALCULATOR_ILLUSTRATION_HEIGHT}
        className="h-auto max-w-full object-contain"
        style={{ width }}
      />
    );
  }
  return <TypeArt type={type} />;
}
