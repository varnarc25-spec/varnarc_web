'use client';

import { useEffect, useState } from 'react';

export function GoToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Go to top of page"
      onClick={() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }}
      className="fixed right-4 bottom-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:right-6 sm:bottom-6"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="size-4"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
      Go to top
    </button>
  );
}
