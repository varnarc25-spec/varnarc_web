'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPublicConfig } from '@varnarc/config';
import type { CurrentUser, HealthResponse } from '@varnarc/types';
import { hasPermission, isAdminRole, type Permission } from '@varnarc/auth';

export function useApiBaseUrl(): string {
  return getPublicConfig().apiUrl;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const apiUrl = getPublicConfig().apiUrl;
  const res = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
    meta?: unknown;
  };

  if (!res.ok) {
    throw new Error(json.error?.message || `Request failed (${res.status})`);
  }

  return (json.data ?? json) as T;
}

export function useHealthCheck(pollMs = 0) {
  const apiUrl = useApiBaseUrl();
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      const json = (await res.json()) as { data: HealthResponse };
      setData(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    void refresh();
    if (pollMs <= 0) return;
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { data, error, loading, refresh };
}

export function usePermissions(user: CurrentUser | null | undefined) {
  const can = useCallback(
    (permission: Permission | Permission[]) =>
      Boolean(user && hasPermission(user.permissions, permission)),
    [user],
  );

  const isAdmin = Boolean(user && isAdminRole(user.roles));

  return { can, isAdmin, permissions: user?.permissions ?? [], roles: user?.roles ?? [] };
}
