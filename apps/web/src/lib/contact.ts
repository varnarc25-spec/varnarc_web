import { z } from 'zod';

export const CONTACT_TOPICS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'technical-support', label: 'Technical support' },
  { value: 'content-correction', label: 'Content correction' },
  { value: 'business-listing', label: 'Business listing' },
  { value: 'service-provider', label: 'Service provider enquiry' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'privacy-request', label: 'Privacy request' },
  { value: 'other', label: 'Other' },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value'];

export const contactTopicValues = CONTACT_TOPICS.map((t) => t.value) as [
  ContactTopic,
  ...ContactTopic[],
];

export const CORRECTION_ISSUE_TYPES = [
  { value: 'incorrect', label: 'Incorrect information' },
  { value: 'outdated', label: 'Outdated information' },
  { value: 'broken-link', label: 'Broken link' },
  { value: 'missing', label: 'Missing information' },
  { value: 'typo', label: 'Typo / wording issue' },
  { value: 'other', label: 'Other' },
] as const;

export type CorrectionIssueType = (typeof CORRECTION_ISSUE_TYPES)[number]['value'];

export const SUPPORT_ISSUE_TYPES = [
  { value: 'account', label: 'Account' },
  { value: 'calculator', label: 'Calculator/tool issue' },
  { value: 'page', label: 'Page not working' },
  { value: 'login', label: 'Login' },
  { value: 'directory', label: 'Directory/provider issue' },
  { value: 'other', label: 'Other' },
] as const;

export type SupportIssueType = (typeof SUPPORT_ISSUE_TYPES)[number]['value'];

export const BUSINESS_ENQUIRY_TYPES = [
  { value: 'partnership', label: 'Partnership', topic: 'partnership' },
  { value: 'advertising', label: 'Advertising', topic: 'advertising' },
  { value: 'business-listing', label: 'Business listing', topic: 'business-listing' },
  { value: 'service-provider', label: 'Service provider enquiry', topic: 'service-provider' },
  { value: 'other-commercial', label: 'Other commercial enquiry', topic: 'partnership' },
] as const;

export type BusinessEnquiryType = (typeof BUSINESS_ENQUIRY_TYPES)[number]['value'];

export type ContactPurposeKey = 'general' | 'correction' | 'business' | 'support';

export const CONTACT_PURPOSE_CARDS: Array<{
  key: ContactPurposeKey;
  topic: ContactTopic;
  title: string;
  description: string;
}> = [
  {
    key: 'general',
    topic: 'general',
    title: 'General enquiries',
    description: 'Questions about Varnarc, our tools, content or platform.',
  },
  {
    key: 'correction',
    topic: 'content-correction',
    title: 'Content & corrections',
    description: 'Report outdated, inaccurate, incomplete or unclear information.',
  },
  {
    key: 'business',
    topic: 'partnership',
    title: 'Business & partnerships',
    description: 'Partnerships, business listings, advertising and commercial enquiries.',
  },
  {
    key: 'support',
    topic: 'technical-support',
    title: 'Support',
    description: 'Get help with your account, tools or platform features.',
  },
];

const TYPE_ALIASES: Record<string, ContactTopic> = {
  general: 'general',
  support: 'technical-support',
  'technical-support': 'technical-support',
  correction: 'content-correction',
  'content-correction': 'content-correction',
  partnership: 'partnership',
  advertising: 'advertising',
  listing: 'business-listing',
  'business-listing': 'business-listing',
  provider: 'service-provider',
  'service-provider': 'service-provider',
  privacy: 'privacy-request',
  'privacy-request': 'privacy-request',
  other: 'other',
};

export function resolveContactTopic(raw?: string | null): ContactTopic | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return TYPE_ALIASES[key] ?? null;
}

export function purposeKeyForTopic(topic: ContactTopic): ContactPurposeKey {
  switch (topic) {
    case 'content-correction':
      return 'correction';
    case 'partnership':
    case 'advertising':
    case 'business-listing':
    case 'service-provider':
      return 'business';
    case 'technical-support':
      return 'support';
    default:
      return 'general';
  }
}

export function isBusinessTopic(topic: ContactTopic): boolean {
  return purposeKeyForTopic(topic) === 'business';
}

export function isCorrectionTopic(topic: ContactTopic): boolean {
  return topic === 'content-correction';
}

export function isSupportTopic(topic: ContactTopic): boolean {
  return topic === 'technical-support';
}

export function isSafeRelativePath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');
}

export function isSafePublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Sanitize page query param for prefill — relative paths preferred. */
export function sanitizePrefillPage(raw?: string | null): string {
  if (!raw) return '';
  const value = raw.trim().slice(0, 500);
  if (isSafeRelativePath(value)) return value;
  if (isSafePublicUrl(value)) {
    try {
      const url = new URL(value);
      return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
    } catch {
      return '';
    }
  }
  return '';
}

const baseFields = {
  topic: z.enum(contactTopicValues, { required_error: 'Please choose a topic.' }),
  name: z.string().trim().min(2, 'Please enter your name.').max(120, 'Name is too long.'),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  subject: z.string().trim().max(160, 'Subject is too long.').optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Please add a little more detail.')
    .max(5000, 'Message is too long.'),
  /** Honeypot — must stay empty. */
  faxNumber: z.string().max(200).optional(),
  formStartedAt: z.coerce.number().optional(),
  pageUrl: z.string().trim().max(500).optional().or(z.literal('')),
  correctionIssue: z.string().optional().or(z.literal('')),
  supportIssue: z.string().optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  orgWebsite: z.string().trim().max(500).optional().or(z.literal('')),
  supportFeature: z.string().trim().max(200).optional().or(z.literal('')),
};

export const contactFormSchema = z
  .object(baseFields)
  .superRefine((data, ctx) => {
    const topic = data.topic;

    if (isCorrectionTopic(topic)) {
      const page = data.pageUrl?.trim() ?? '';
      if (!page) {
        ctx.addIssue({ code: 'custom', path: ['pageUrl'], message: 'Please paste the page URL.' });
      } else if (!isSafePublicUrl(page) && !isSafeRelativePath(page)) {
        ctx.addIssue({
          code: 'custom',
          path: ['pageUrl'],
          message: 'Enter a valid page URL or path.',
        });
      }
      const issue = data.correctionIssue?.trim() ?? '';
      if (!CORRECTION_ISSUE_TYPES.some((item) => item.value === issue)) {
        ctx.addIssue({
          code: 'custom',
          path: ['correctionIssue'],
          message: 'Please choose an issue type.',
        });
      }
    } else if (isSupportTopic(topic)) {
      const issue = data.supportIssue?.trim() ?? '';
      if (!SUPPORT_ISSUE_TYPES.some((item) => item.value === issue)) {
        ctx.addIssue({
          code: 'custom',
          path: ['supportIssue'],
          message: 'Please choose an issue type.',
        });
      }
    } else if (isBusinessTopic(topic)) {
      const company = data.company?.trim() ?? '';
      if (company.length < 2) {
        ctx.addIssue({
          code: 'custom',
          path: ['company'],
          message: 'Please enter your company or organisation.',
        });
      }
      const site = data.orgWebsite?.trim() ?? '';
      if (site && !isSafePublicUrl(site)) {
        ctx.addIssue({
          code: 'custom',
          path: ['orgWebsite'],
          message: 'Enter a valid website URL (https://…).',
        });
      }
    } else {
      const subject = data.subject?.trim() ?? '';
      if (subject.length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['subject'],
          message: 'Please enter a subject.',
        });
      }
    }
  })
  .transform((data) => {
    const topic = data.topic;
    let subject = (data.subject ?? '').trim();

    if (isCorrectionTopic(topic)) {
      const issueLabel =
        CORRECTION_ISSUE_TYPES.find((item) => item.value === data.correctionIssue)?.label ??
        'Content correction';
      subject = subject || `Content correction: ${issueLabel}`;
    } else if (isSupportTopic(topic)) {
      const issueLabel =
        SUPPORT_ISSUE_TYPES.find((item) => item.value === data.supportIssue)?.label ?? 'Support';
      subject = subject || `Support: ${issueLabel}`;
    } else if (isBusinessTopic(topic)) {
      subject = subject || `${topicLabel(topic)} enquiry`;
    }

    return {
      topic,
      name: data.name.trim(),
      email: data.email.trim(),
      subject,
      message: data.message.trim(),
      faxNumber: data.faxNumber?.trim() || '',
      formStartedAt: data.formStartedAt,
      pageUrl: data.pageUrl?.trim() || undefined,
      correctionIssue: data.correctionIssue?.trim() || undefined,
      supportIssue: data.supportIssue?.trim() || undefined,
      company: data.company?.trim() || undefined,
      orgWebsite: data.orgWebsite?.trim() || undefined,
      supportFeature: data.supportFeature?.trim() || undefined,
    };
  });

export type ContactFormValues = z.input<typeof contactFormSchema>;
export type ContactFormPayload = z.output<typeof contactFormSchema>;

export function topicLabel(value: string): string {
  return CONTACT_TOPICS.find((t) => t.value === value)?.label ?? value;
}

export function contactDestinationKey(
  topic: ContactTopic,
): 'general' | 'editorial' | 'business' | 'support' | 'privacy' {
  switch (topic) {
    case 'content-correction':
      return 'editorial';
    case 'partnership':
    case 'advertising':
    case 'business-listing':
    case 'service-provider':
      return 'business';
    case 'technical-support':
      return 'support';
    case 'privacy-request':
      return 'privacy';
    default:
      return 'general';
  }
}
