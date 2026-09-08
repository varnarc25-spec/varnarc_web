import { describe, expect, it } from 'vitest';
import { PERMISSIONS, ROLE_DEFINITIONS, hasPermission } from '@varnarc/auth';

describe('construction intelligence RBAC', () => {
  it('grants editor rate view but not import, verify, or settings', () => {
    const editor = ROLE_DEFINITIONS.editor.permissions;
    expect(hasPermission(editor, PERMISSIONS.CONSTRUCTION_RATES_VIEW)).toBe(true);
    expect(hasPermission(editor, PERMISSIONS.CONSTRUCTION_IMPORT)).toBe(false);
    expect(hasPermission(editor, PERMISSIONS.CONSTRUCTION_RATES_VERIFY)).toBe(false);
    expect(hasPermission(editor, PERMISSIONS.CONSTRUCTION_RATES_MANAGE)).toBe(false);
    expect(hasPermission(editor, PERMISSIONS.CONSTRUCTION_SOURCES_MANAGE)).toBe(false);
    expect(hasPermission(editor, PERMISSIONS.CONSTRUCTION_SETTINGS_MANAGE)).toBe(false);
  });

  it('grants super_admin every construction intelligence permission', () => {
    const superAdmin = ROLE_DEFINITIONS.super_admin.permissions;
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_MANAGE)).toBe(true);
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_RATES_VIEW)).toBe(true);
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_RATES_MANAGE)).toBe(true);
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_RATES_VERIFY)).toBe(true);
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_SOURCES_MANAGE)).toBe(true);
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_IMPORT)).toBe(true);
    expect(hasPermission(superAdmin, PERMISSIONS.CONSTRUCTION_SETTINGS_MANAGE)).toBe(true);
  });

  it('denies author construction rate access', () => {
    const author = ROLE_DEFINITIONS.author.permissions;
    expect(hasPermission(author, PERMISSIONS.CONSTRUCTION_RATES_VIEW)).toBe(false);
    expect(hasPermission(author, PERMISSIONS.CONSTRUCTION_IMPORT)).toBe(false);
  });
});
