import { describe, expect, it } from 'vitest';
import { aiProvidersSchema, createAiProviderSchema } from '../src/premium-ai';

const provider = {
  slug: 'open-router',
  name: 'OpenRouter',
  baseUrl: 'https://openrouter.ai/api/v1/',
  defaultModel: 'openai/gpt-4o-mini',
  apiKeyEnvVar: 'OPENROUTER_API_KEY',
  priority: 10,
  isDefault: true,
  isEnabled: true,
};

describe('AI provider schemas', () => {
  it('normalizes a valid provider base URL', () => {
    expect(createAiProviderSchema.parse(provider).baseUrl).toBe('https://openrouter.ai/api/v1');
  });

  it('rejects secret values and duplicate defaults', () => {
    expect(createAiProviderSchema.safeParse({ ...provider, apiKey: 'secret' }).success).toBe(false);
    expect(
      aiProvidersSchema.safeParse([
        provider,
        { ...provider, slug: 'second', name: 'Second provider' },
      ]).success,
    ).toBe(false);
  });

  it('requires a safe environment variable name', () => {
    expect(
      createAiProviderSchema.safeParse({ ...provider, apiKeyEnvVar: 'provider-key' }).success,
    ).toBe(false);
  });
});
