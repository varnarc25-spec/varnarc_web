'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type UiStore = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

const UiStoreContext = createContext<UiStore | null>(null);

export function UiStoreProvider({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const value = useMemo(() => ({ mobileNavOpen, setMobileNavOpen }), [mobileNavOpen]);
  return <UiStoreContext.Provider value={value}>{children}</UiStoreContext.Provider>;
}

export function useUiStore() {
  const ctx = useContext(UiStoreContext);
  if (!ctx) throw new Error('useUiStore must be used within UiStoreProvider');
  return ctx;
}
