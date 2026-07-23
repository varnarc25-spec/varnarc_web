import { describe, expect, it } from 'vitest';
import {
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

describe('securitySettingsSchema', () => {
  it('enforces rate limit bounds', () => {
    expect(() => securitySettingsSchema.parse({ rateLimitPerMinute: 0 })).toThrow();
    const parsed = securitySettingsSchema.parse({});
    expect(parsed.rateLimitPerMinute).toBe(120);
  });
});
