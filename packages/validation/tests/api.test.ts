import { describe, expect, it } from 'vitest';
import { createApiKeySchema, createWebhookSchema } from '../src/api';

describe('createApiKeySchema', () => {
  it('accepts valid input', () => {
    const parsed = createApiKeySchema.parse({ name: 'CI key', scopes: ['read'] });
    expect(parsed.scopes).toEqual(['read']);
  });

  it('rejects empty name', () => {
    expect(() => createApiKeySchema.parse({ name: '' })).toThrow();
  });
});

describe('createWebhookSchema', () => {
  it('requires https url and events', () => {
    const parsed = createWebhookSchema.parse({
      name: 'CRM',
      url: 'https://example.com/hook',
      events: ['lead.created'],
    });
    expect(parsed.enabled).toBe(true);
  });

  it('rejects invalid url', () => {
    expect(() =>
      createWebhookSchema.parse({
        name: 'Bad',
        url: 'not-a-url',
        events: ['lead.created'],
      }),
    ).toThrow();
  });
});
