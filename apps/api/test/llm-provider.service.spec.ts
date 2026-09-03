import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmProviderService } from '../src/modules/ai/llm-provider.service';

const providers = [
  {
    slug: 'primary',
    name: 'Primary',
    baseUrl: 'https://primary.test/v1',
    defaultModel: 'primary-model',
    apiKeyEnvVar: 'PRIMARY_AI_KEY',
    priority: 20,
    isDefault: true,
    isEnabled: true,
  },
  {
    slug: 'backup',
    name: 'Backup',
    baseUrl: 'https://backup.test/v1',
    defaultModel: 'backup-model',
    apiKeyEnvVar: 'BACKUP_AI_KEY',
    priority: 1,
    isDefault: false,
    isEnabled: true,
  },
];

describe('LlmProviderService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PRIMARY_AI_KEY;
    delete process.env.BACKUP_AI_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('fails over after a provider HTTP 401', async () => {
    process.env.PRIMARY_AI_KEY = 'primary-secret';
    process.env.BACKUP_AI_KEY = 'backup-secret';
    const repos = {
      settings: { findByKey: vi.fn().mockResolvedValue({ value: providers }) },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: [{ message: 'invalid provider key' }] }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: 'backup result' } }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const service = new LlmProviderService(repos as never);
    await expect(service.chatCompletion([{ role: 'user', content: 'hello' }])).resolves.toBe(
      'backup result',
    );
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://primary.test/v1/chat/completions',
      'https://backup.test/v1/chat/completions',
    ]);
  });

  it('uses legacy environment configuration when the setting row is absent', async () => {
    process.env.OPENAI_API_KEY = 'legacy-secret';
    const repos = {
      settings: { findByKey: vi.fn().mockResolvedValue(null) },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'legacy result' } }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const service = new LlmProviderService(repos as never);
    await expect(service.chatCompletion([{ role: 'user', content: 'hello' }])).resolves.toBe(
      'legacy result',
    );
  });
});
