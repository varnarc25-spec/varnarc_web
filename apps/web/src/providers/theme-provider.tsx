'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function ThemeProvider({
  children,
  styleBlock,
}: {
  children: ReactNode;
  styleBlock?: string | null;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {styleBlock ? (
        <style id="varnarc-theme-tokens" dangerouslySetInnerHTML={{ __html: styleBlock }} />
      ) : null}
      {children}
    </NextThemesProvider>
  );
}
