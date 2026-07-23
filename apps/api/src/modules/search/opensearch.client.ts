import { Logger } from '@nestjs/common';
import { getOpenSearchEnv, isOpenSearchEngine, resolveSearchEngine } from '@varnarc/config';

export type OpenSearchConfig = {
  url: string;
  index: string;
  username?: string;
  password?: string;
  requestTimeoutMs: number;
};

export function getOpenSearchConfig(): OpenSearchConfig | null {
  const env = getOpenSearchEnv();
  if (!env) return null;
  return {
    url: env.url,
    index: env.index,
    username: env.username,
    password: env.password,
    requestTimeoutMs: env.requestTimeoutMs,
  };
}

export function isOpenSearchReadEnabled() {
  return isOpenSearchEngine() && Boolean(getOpenSearchConfig());
}

export function resolvedSearchEngine() {
  return resolveSearchEngine();
}

export class OpenSearchClient {
  private readonly logger = new Logger(OpenSearchClient.name);

  constructor(private readonly config: OpenSearchConfig) {}

  private authHeader(): Record<string, string> {
    const { username, password } = this.config;
    if (!username || !password) return {};
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    try {
      const res = await fetch(`${this.config.url}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.authHeader(),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`OpenSearch ${method} ${path} failed: ${res.status} ${text.slice(0, 200)}`);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async ensureIndex() {
    const { index } = this.config;
    try {
      await this.request('GET', `/${index}`);
      return;
    } catch {
      // create below
    }

    await this.request('PUT', `/${index}`, {
      settings: {
        number_of_shards: Number(process.env.OPENSEARCH_SHARDS ?? 1),
        number_of_replicas: Number(process.env.OPENSEARCH_REPLICAS ?? 1),
        refresh_interval: process.env.OPENSEARCH_REFRESH_INTERVAL ?? '30s',
      },
      mappings: {
        properties: {
          entityType: { type: 'keyword' },
          entityId: { type: 'keyword' },
          title: { type: 'text' },
          summary: { type: 'text' },
          content: { type: 'text' },
          keywords: { type: 'text' },
          tags: { type: 'keyword' },
          slug: { type: 'keyword' },
          url: { type: 'keyword' },
          category: { type: 'keyword' },
          location: { type: 'keyword' },
          author: { type: 'keyword' },
          brand: { type: 'keyword' },
          language: { type: 'keyword' },
          status: { type: 'keyword' },
          featured: { type: 'boolean' },
          sponsored: { type: 'boolean' },
          verified: { type: 'boolean' },
          rating: { type: 'float' },
          viewCount: { type: 'integer' },
          publishedAt: { type: 'date' },
        },
      },
    });
    this.logger.log(`Created OpenSearch index: ${index}`);
  }

  docId(entityType: string, entityId: string) {
    return `${entityType}:${entityId}`;
  }

  async indexDocument(id: string, doc: Record<string, unknown>) {
    await this.request('PUT', `/${this.config.index}/_doc/${encodeURIComponent(id)}`, doc);
  }

  async deleteDocument(id: string) {
    try {
      await this.request('DELETE', `/${this.config.index}/_doc/${encodeURIComponent(id)}`);
    } catch (err) {
      this.logger.debug(`OpenSearch delete ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async deleteByEntityTypes(entityTypes: string[]) {
    await this.request('POST', `/${this.config.index}/_delete_by_query`, {
      query: { terms: { entityType: entityTypes } },
    });
  }

  async search(body: Record<string, unknown>) {
    return this.request<{
      hits: { hits: Array<{ _source: Record<string, unknown>; _score?: number }> };
    }>('POST', `/${this.config.index}/_search`, body);
  }

  async ping() {
    try {
      await this.request<{ cluster_name?: string }>('GET', '/');
      return true;
    } catch {
      return false;
    }
  }
}

export const OPENSEARCH_CLIENT = Symbol('OPENSEARCH_CLIENT');
