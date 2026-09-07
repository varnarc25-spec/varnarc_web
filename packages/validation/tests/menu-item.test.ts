import { describe, expect, it } from 'vitest';
import { createMenuItemSchema, updateMenuItemSchema } from '../src/cms';

describe('updateMenuItemSchema', () => {
  it('accepts a disable-only payload without filling defaults', () => {
    expect(updateMenuItemSchema.parse({ isActive: false })).toEqual({ isActive: false });
  });
});

describe('createMenuItemSchema', () => {
  it('defaults new items to active', () => {
    const parsed = createMenuItemSchema.parse({ label: 'Home' });
    expect(parsed.isActive).toBe(true);
    expect(parsed.sortOrder).toBe(0);
  });
});
