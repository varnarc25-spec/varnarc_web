export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type CursorMeta = {
  nextCursor: string | null;
  prevCursor?: string | null;
  hasMore: boolean;
  limit: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
}

/**
 * Public (unauthenticated) API fetch — for articles, homepage, directory, etc.
 */
export async function apiPublicFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    next: init.cache === 'no-store' ? undefined : { revalidate: 60 },
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> & {
    meta?: Record<string, unknown>;
    data?: T;
  };

  if (!res.ok || (json as ApiFailure).success === false) {
    const err = json as ApiFailure;
    throw new ApiError(
      err.error?.message || `Request failed (${res.status})`,
      res.status,
      err.error?.code,
    );
  }

  return {
    data: (json as ApiSuccess<T>).data,
    meta: (json as ApiSuccess<T>).meta,
  };
}

/**
 * Client-side fetch with optional bearer token.
 */
export async function apiClientFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const { token, headers, ...rest } = options;
  const apiUrl = getApiBaseUrl();
  const res = await fetch(`${apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> & {
    meta?: Record<string, unknown>;
  };

  if (!res.ok || (json as ApiFailure).success === false) {
    const err = json as ApiFailure;
    throw new ApiError(
      err.error?.message || `Request failed (${res.status})`,
      res.status,
      err.error?.code,
    );
  }

  return {
    data: (json as ApiSuccess<T>).data,
    meta: (json as ApiSuccess<T>).meta,
  };
}
