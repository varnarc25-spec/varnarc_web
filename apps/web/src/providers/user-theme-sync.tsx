'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

type Prefs = { theme?: string | null };

/** Applies saved user theme preference from the API. */
export function UserThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/preferences');
        if (!res.ok) return;
        const json = (await res.json()) as { data?: Prefs };
        const theme = json.data?.theme;
        if (!cancelled && theme && theme !== 'system') {
          setTheme(theme);
        }
      } catch {
        // Guest or API unavailable — keep default theme
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  useEffect(() => {
    function onPrefsSaved(e: Event) {
      const theme = (e as CustomEvent<{ theme?: string | null }>).detail?.theme;
      if (theme && theme !== 'system') setTheme(theme);
      else if (theme === 'system') setTheme('system');
    }
    window.addEventListener('varnarc:prefs-saved', onPrefsSaved);
    return () => window.removeEventListener('varnarc:prefs-saved', onPrefsSaved);
  }, [setTheme]);

  return null;
}
