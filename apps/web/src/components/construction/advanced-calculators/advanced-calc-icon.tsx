import { type ADVANCED_CONSTRUCTION_CALCULATORS } from '@varnarc/validation';

type IconName = (typeof ADVANCED_CONSTRUCTION_CALCULATORS)[number]['icon'];

export function AdvancedCalcIcon({ name }: { name: IconName }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-7 w-7 text-[#f97316]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (name === 'ceiling') {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M6 7v4h12V7" />
        <path d="M8 11v3M16 11v3" />
      </svg>
    );
  }
  if (name === 'stairs') {
    return (
      <svg {...common}>
        <path d="M4 20h4v-4h4v-4h4V8h4V4" />
      </svg>
    );
  }
  if (name === 'tank') {
    return (
      <svg {...common}>
        <rect x="5" y="6" width="14" height="14" rx="2" />
        <path d="M8 12h8" />
      </svg>
    );
  }
  if (name === 'roof') {
    return (
      <svg {...common}>
        <path d="M3 12 12 4l9 8" />
        <path d="M5 12v8h14v-8" />
      </svg>
    );
  }
  if (name === 'block') {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="8" height="6" />
        <rect x="13" y="6" width="8" height="6" />
        <rect x="8" y="13" width="8" height="6" />
      </svg>
    );
  }
  if (name === 'wall') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <path d="M4 12h16M12 4v16" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 8h16v12H4z" />
      <path d="M8 8V5h8v3" />
    </svg>
  );
}
