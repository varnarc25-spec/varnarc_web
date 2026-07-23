'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { UiStoreProvider } from '@/stores/ui-store';
import { I18nProvider } from '@/providers/i18n-provider';
import { UserThemeSync } from '@/providers/user-theme-sync';

export function AppProviders({
  children,
  themeStyleBlock,
}: {
  children: ReactNode;
  themeStyleBlock?: string | null;
}) {
  return (
    <ThemeProvider styleBlock={themeStyleBlock}>
      <UserThemeSync />
      <I18nProvider>
        <QueryProvider>
          <UiStoreProvider>
            {children}
            <ToastProvider />
          </UiStoreProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
