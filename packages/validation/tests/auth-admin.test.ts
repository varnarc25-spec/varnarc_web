import { describe, expect, it } from 'vitest';
import { adminLoginSchema, createStaffUserSchema } from '../src/auth';

describe('adminLoginSchema', () => {
  it('requires a valid email and password', () => {
    const parsed = adminLoginSchema.parse({
      email: 'admin@varnarc.com',
      password: 'password1',
    });
    expect(parsed.email).toBe('admin@varnarc.com');
  });

  it('rejects a short password', () => {
    expect(() => adminLoginSchema.parse({ email: 'a@b.com', password: 'short' })).toThrow();
  });
});

describe('createStaffUserSchema', () => {
  it('defaults role to admin', () => {
    const parsed = createStaffUserSchema.parse({
      email: 'staff@varnarc.com',
      password: 'password1',
    });
    expect(parsed.roleSlug).toBe('admin');
  });

  it('allows editor and rejects super_admin via staff create', () => {
    expect(
      createStaffUserSchema.parse({
        email: 'editor@varnarc.com',
        password: 'password1',
        roleSlug: 'editor',
      }).roleSlug,
    ).toBe('editor');
    expect(() =>
      createStaffUserSchema.parse({
        email: 'other@varnarc.com',
        password: 'password1',
        roleSlug: 'super_admin',
      }),
    ).toThrow();
  });
});
