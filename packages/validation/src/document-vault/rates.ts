/** Construction Project Document Vault — categories & labels. */

export const DOCUMENT_VAULT_VERSION = '2026.08.1';

export const DOCUMENT_VAULT_QUALIFICATION =
  'Project documents are private to the project owner. Files are not served through public URLs — use View / Download after signing in.';

/** User-facing vault categories (map to ConstructionDocumentKind). */
export const DOCUMENT_VAULT_CATEGORIES = [
  { id: 'FLOOR_PLAN', label: 'Floor plans' },
  { id: 'STRUCTURAL', label: 'Structural drawings' },
  { id: 'BOQ', label: 'BOQ' },
  { id: 'QUOTE', label: 'Contractor quotations' },
  { id: 'INVOICE', label: 'Invoices' },
  { id: 'RECEIPT', label: 'Receipts' },
  { id: 'APPROVAL', label: 'Approvals' },
  { id: 'WARRANTY', label: 'Warranties' },
  { id: 'MATERIAL_BILL', label: 'Material bills' },
  { id: 'PHOTO', label: 'Site photos' },
  { id: 'OTHER', label: 'Other' },
] as const;

export type DocumentVaultCategoryId = (typeof DOCUMENT_VAULT_CATEGORIES)[number]['id'];

export const DOCUMENT_VAULT_CATEGORY_LABELS: Record<DocumentVaultCategoryId, string> = {
  FLOOR_PLAN: 'Floor plans',
  STRUCTURAL: 'Structural drawings',
  BOQ: 'BOQ',
  QUOTE: 'Contractor quotations',
  INVOICE: 'Invoices',
  RECEIPT: 'Receipts',
  APPROVAL: 'Approvals',
  WARRANTY: 'Warranties',
  MATERIAL_BILL: 'Material bills',
  PHOTO: 'Site photos',
  OTHER: 'Other',
};

/** Sanitize upload filename — alphanumeric, dash, underscore, single extension. */
export function sanitizeDocumentFilename(original: string): string {
  const base = original.split(/[/\\]/).pop() ?? 'file';
  const parts = base.split('.');
  const ext =
    parts.length > 1
      ? parts
          .pop()!
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 12)
      : '';
  const name = parts
    .join('.')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const safe = name || 'document';
  return ext ? `${safe}.${ext}` : safe;
}
