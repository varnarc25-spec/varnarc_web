import { describe, expect, it } from 'vitest';
import {
  adsenseSettingsSchema,
  generalSettingsSchema,
  maintenanceSettingsSchema,
  securitySettingsSchema,
} from '../src/settings';

describe('generalSettingsSchema', () => {
  it('applies defaults', () => {
    const parsed = generalSettingsSchema.parse({ siteName: 'Varnarc' });
    expect(parsed.timezone).toBe('UTC');
    expect(parsed.locale).toBe('en');
  });

  it('rejects empty site name', () => {
    expect(() => generalSettingsSchema.parse({ siteName: '' })).toThrow();
  });
});

describe('maintenanceSettingsSchema', () => {
  it('parses maintenance flags', () => {
    const parsed = maintenanceSettingsSchema.parse({
      enabled: true,
      message: 'Down for maintenance',
    });
    expect(parsed.enabled).toBe(true);
    expect(parsed.bypassRoles).toEqual([]);
  });
});

describe('adsenseSettingsSchema', () => {
  it('accepts a publisher ID and named slots', () => {
    const parsed = adsenseSettingsSchema.parse({
      enabled: true,
      client: 'ca-pub-6274053387170397',
      defaultSlot: '1234567890',
      slots: { 'calculator-sidebar': '1234567891' },
    });
    expect(parsed.client).toBe('ca-pub-6274053387170397');
    expect(parsed.slots['calculator-sidebar']).toBe('1234567891');
  });

  it('rejects an invalid publisher ID', () => {
    expect(() => adsenseSettingsSchema.parse({ client: 'pub-123' })).toThrow();
  });
});

describe('securitySettingsSchema', () => {
  it('enforces rate limit bounds', () => {
    expect(() => securitySettingsSchema.parse({ rateLimitPerMinute: 0 })).toThrow();
    const parsed = securitySettingsSchema.parse({});
    expect(parsed.rateLimitPerMinute).toBe(120);
  });
});
