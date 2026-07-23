import { VarnarcApiError } from './errors';
import type {
  ApiEnvelope,
  DeveloperPortalInfo,
  SearchQuery,
  SearchResult,
  StatusInfo,
  VersionInfo,
  VarnarcClientOptions,
} from './types';

const DEFAULT_BASE_URL = 'http://localhost:4000/api/v1';

export class VarnarcClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly bearerToken?: string;
  private readonly fetchFn: typeof fetch;
  private readonly extraHeaders: Record<string, string>;

  constructor(options: VarnarcClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.bearerToken = options.bearerToken;
    this.fetchFn = options.fetch ?? fetch;
    this.extraHeaders = options.headers ?? {};
  }

  async getDevelopers(): Promise<DeveloperPortalInfo> {
    return this.request<DeveloperPortalInfo>('/developers');
  }

  async getVersion(): Promise<VersionInfo> {
    return this.request<VersionInfo>('/version');
  }

  async getStatus(): Promise<StatusInfo> {
    return this.request<StatusInfo>('/status');
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query.q });
    if (query.types?.length) params.set('types', query.types.join(','));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.cursor) params.set('cursor', query.cursor);
    return this.request<SearchResult>(`/search?${params.toString()}`);
  }

  async autocomplete(q: string, limit = 8): Promise<{ suggestions: string[] }> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.request<{ suggestions: string[] }>(`/search/autocomplete?${params.toString()}`);
  }

  async listArticles(params: { cursor?: string; limit?: number } = {}): Promise<{
    items: Array<Record<string, unknown>>;
    meta?: Record<string, unknown>;
  }> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const suffix = searchParams.size ? `?${searchParams.toString()}` : '';
    return this.request(`/cms/articles${suffix}`);
  }

  async getArticleBySlug(slug: string): Promise<Record<string, unknown>> {
    return this.request(`/cms/articles/slug/${encodeURIComponent(slug)}`);
  }

  async listCalculators(params: { cursor?: string; limit?: number } = {}): Promise<{
    items: Array<Record<string, unknown>>;
    meta?: Record<string, unknown>;
  }> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));
    const suffix = searchParams.size ? `?${searchParams.toString()}` : '';
    return this.request(`/calculators${suffix}`);
  }

  async getCalculatorBySlug(slug: string): Promise<Record<string, unknown>> {
    return this.request(`/calculators/slug/${encodeURIComponent(slug)}`);
  }

  async executeCalculator(
    slug: string,
    inputs: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.request(`/calculators/slug/${encodeURIComponent(slug)}/execute`, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.extraHeaders,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    };

    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    if (this.bearerToken) {
      headers.Authorization = `Bearer ${this.bearerToken}`;
    }

    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;

    if (!res.ok || json.success === false) {
      const failure = json as Extract<ApiEnvelope<T>, { success: false }>;
      throw new VarnarcApiError(
        failure.error?.message ?? `Request failed (${res.status})`,
        res.status,
        failure.error?.code,
        failure.error?.details,
      );
    }

    return (json as { data: T }).data;
  }
}
