'use client';

import { useSyncExternalStore } from 'react';
import type { SaveConstructionCalculationInput } from '@varnarc/validation';
import { SAVED_CONSTRUCTION_CALC_PENDING_KEY } from '@varnarc/validation';

export type ConstructionSavePayload = SaveConstructionCalculationInput;

type Listener = () => void;

let current: ConstructionSavePayload | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function setConstructionSavePayload(payload: ConstructionSavePayload | null) {
  current = payload;
  emit();
}

export function getConstructionSavePayload() {
  return current;
}

export function subscribeConstructionSavePayload(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConstructionSavePayload() {
  return useSyncExternalStore(
    subscribeConstructionSavePayload,
    getConstructionSavePayload,
    () => null,
  );
}

export function stashPendingConstructionSave(payload: ConstructionSavePayload) {
  if (typeof window === 'undefined') return;
  const pending = {
    ...payload,
    savedAtClient: new Date().toISOString(),
  };
  sessionStorage.setItem(SAVED_CONSTRUCTION_CALC_PENDING_KEY, JSON.stringify(pending));
}

export function readPendingConstructionSave(): ConstructionSavePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SAVED_CONSTRUCTION_CALC_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConstructionSavePayload;
  } catch {
    return null;
  }
}

export function clearPendingConstructionSave() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SAVED_CONSTRUCTION_CALC_PENDING_KEY);
}

export async function flushPendingConstructionSave(): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
}> {
  const pending = readPendingConstructionSave();
  if (!pending) return { ok: false, error: 'nothing_pending' };
  try {
    const res = await fetch('/api/construction/calculations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pending),
    });
    if (res.status === 401) return { ok: false, error: 'unauthorized' };
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        ok: false,
        error: body?.error?.message ?? 'Save failed',
      };
    }
    const json = (await res.json()) as { data?: { id?: string } };
    clearPendingConstructionSave();
    return { ok: true, id: json.data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export function loginUrlForSave(returnPath: string) {
  const returnTo = returnPath.startsWith('/') ? returnPath : `/${returnPath}`;
  return `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}
