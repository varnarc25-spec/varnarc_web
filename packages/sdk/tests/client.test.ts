import { describe, expect, it, vi } from 'vitest';
import { VarnarcClient } from '../src/client';
import { VarnarcApiError } from '../src/errors';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('VarnarcClient', () => {
  it('fetches version metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        data: { version: '1.0.0', apiPrefix: '/api/v1', environment: 'test', node: 'v20' },
      }),
    );

    const client = new VarnarcClient({ baseUrl: 'https://api.example.com/api/v1', fetch: fetchMock });
    const version = await client.getVersion();

    expect(version.version).toBe('1.0.0');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/version',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) }),
    );
  });

  it('sends API key and bearer headers when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ success: true, data: { items: [], meta: { hasMore: false } } }),
    );

    const client = new VarnarcClient({
      baseUrl: 'https://api.example.com/api/v1',
      apiKey: 'vk_test_key',
      bearerToken: 'jwt-token',
      fetch: fetchMock,
    });

    await client.search({ q: 'emi' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/search?'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Api-Key': 'vk_test_key',
          Authorization: 'Bearer jwt-token',
        }),
      }),
    );
  });

  it('throws VarnarcApiError on failure envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { success: false, error: { code: 'NOT_FOUND', message: 'Article not found.' } },
        404,
      ),
    );

    const client = new VarnarcClient({ fetch: fetchMock });

    await expect(client.getArticleBySlug('missing')).rejects.toBeInstanceOf(VarnarcApiError);
  });
});
