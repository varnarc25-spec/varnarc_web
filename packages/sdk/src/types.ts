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

export type DeveloperPortalInfo = {
  version: string;
  apiPrefix: string;
  portalUrl: string;
  docs: {
    swagger: string;
    openapiJson: string;
    gettingStarted: string;
    authentication: string;
    webhooks: string;
    sdk: string;
  };
  sdk: {
    package: string;
    install: string;
    workspacePath: string;
  };
  authentication: {
    methods: readonly string[];
    bearerHeader: string;
    apiKeyHeader: string;
    note: string;
  };
  rateLimits: {
    global: { ttlMs: number; limit: number };
    storage: string;
    notes: string;
  };
  webhooks: {
    events: readonly string[];
    signatureHeader: string;
    eventHeader: string;
    algorithm: string;
  };
  publicModules: Array<{ id: string; path: string; description: string }>;
};

export type VersionInfo = {
  version: string;
  apiPrefix: string;
  environment: string;
  node: string;
};

export type StatusInfo = {
  service: string;
  status: string;
  timestamp: string;
  database: string;
  cache: string;
  docsUrl: string;
  last24h: { total: number; errors: number; avgDurationMs: number };
};

export type SearchQuery = {
  q: string;
  types?: string[];
  limit?: number;
  cursor?: string;
};

export type SearchResult = {
  items: Array<Record<string, unknown>>;
  meta?: CursorMeta;
};

export type VarnarcClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  bearerToken?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
};
