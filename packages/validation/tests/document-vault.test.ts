import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_VAULT_CATEGORIES,
  DOCUMENT_VAULT_CATEGORY_LABELS,
  sanitizeDocumentFilename,
} from '../src/document-vault';

describe('document vault', () => {
  it('covers required categories', () => {
    const ids = DOCUMENT_VAULT_CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'FLOOR_PLAN',
        'STRUCTURAL',
        'BOQ',
        'QUOTE',
        'INVOICE',
        'RECEIPT',
        'APPROVAL',
        'WARRANTY',
        'MATERIAL_BILL',
        'PHOTO',
        'OTHER',
      ]),
    );
    for (const c of DOCUMENT_VAULT_CATEGORIES) {
      expect(DOCUMENT_VAULT_CATEGORY_LABELS[c.id]).toBe(c.label);
    }
  });

  it('sanitizes unsafe filenames', () => {
    expect(sanitizeDocumentFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeDocumentFilename('My Floor Plan (Rev 2).PDF')).toBe('my-floor-plan-rev-2.pdf');
    expect(sanitizeDocumentFilename('')).toBe('document');
    expect(sanitizeDocumentFilename('a'.repeat(300)).length).toBeLessThanOrEqual(180);
  });
});
