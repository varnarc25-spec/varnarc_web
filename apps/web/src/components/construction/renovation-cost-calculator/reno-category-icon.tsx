import type { RenovationCategoryCard } from '@varnarc/validation';

export function RenoCategoryIcon({ name }: { name: RenovationCategoryCard['icon'] }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-6 w-6 text-[#f97316]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  if (name === 'kitchen') {
    return (
      <svg {...common}>
        <path d="M4 20V10h16v10" />
        <path d="M8 10V6h8v4" />
        <path d="M10 14h4" />
      </svg>
    );
  }
  if (name === 'bath') {
    return (
      <svg {...common}>
        <path d="M4 12h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" />
        <path d="M7 12V7a3 3 0 0 1 6 0" />
      </svg>
    );
  }
  if (name === 'floor') {
    return (
      <svg {...common}>
        <path d="M4 8h7v7H4zM13 8h7v7h-7zM4 16h7v4H4zM13 16h7v4h-7z" />
      </svg>
    );
  }
  if (name === 'paint') {
    return (
      <svg {...common}>
        <path d="M7 4h10l1 7H6L7 4Z" />
        <path d="M9 11v5a3 3 0 0 0 6 0v-5" />
      </svg>
    );
  }
  if (name === 'ceiling') {
    return (
      <svg {...common}>
        <path d="M4 8h16" />
        <path d="M7 8v4M12 8v4M17 8v4" />
        <path d="M5 20h14" />
      </svg>
    );
  }
  if (name === 'electrical') {
    return (
      <svg {...common}>
        <path d="M13 3 6 13h6l-1 8 8-11h-6l2-7Z" />
      </svg>
    );
  }
  if (name === 'plumbing') {
    return (
      <svg {...common}>
        <path d="M8 4v7a4 4 0 0 0 8 0V4" />
        <path d="M12 15v5" />
        <path d="M9 20h6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 20V8l7-4 7 4v12" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}
