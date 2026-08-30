/** SEO / FAQs for Construction Project Document Vault. */

export const DOCUMENT_VAULT_FAQS = [
  {
    id: 'faq-private',
    question: 'Are my project files public?',
    answer:
      'No. Vault files are private to the project owner. They are not exposed through public URLs. View and download require sign-in and project access.',
  },
  {
    id: 'faq-types',
    question: 'Which file types can I upload?',
    answer:
      'Images (JPEG, PNG, WebP, AVIF, SVG), PDF, Office documents (DOCX, XLSX, PPTX), plain text, and common video formats. Maximum size is 50 MB. Filenames are sanitized on upload.',
  },
  {
    id: 'faq-links',
    question: 'Can I link a document to a BOQ, expense, quote or phase?',
    answer:
      'Yes. When uploading, optionally attach the file to a project BOQ, expense, construction phase, or an existing quotation document so it stays organised in context.',
  },
];

export const DOCUMENT_VAULT_RELATED = [
  { href: '/construction/boq-generator', label: 'BOQ Generator' },
  { href: '/construction/budget-tracker', label: 'Budget tracker' },
  { href: '/construction/timeline-planner', label: 'Timeline planner' },
  { href: '/construction/project/new', label: 'Create project' },
];

export const DOCUMENT_VAULT_SEO = `Store floor plans, structural drawings, BOQ files, quotations, invoices, receipts and site photos in a private construction project vault. Secure authorization, file validation and authenticated view/download — no public file URLs.`;
