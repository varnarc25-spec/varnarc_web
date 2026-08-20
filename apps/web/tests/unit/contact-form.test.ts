import { describe, expect, it } from 'vitest';
import {
  contactDestinationKey,
  contactFormSchema,
  purposeKeyForTopic,
  resolveContactTopic,
  sanitizePrefillPage,
} from '@/lib/contact';

describe('contactFormSchema', () => {
  it('accepts a complete general enquiry', () => {
    const parsed = contactFormSchema.safeParse({
      topic: 'general',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Question about calculators',
      message: 'I would like to understand how the EMI calculator works.',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid email and a short message', () => {
    const parsed = contactFormSchema.safeParse({
      topic: 'technical-support',
      name: 'Ada',
      email: 'not-an-email',
      supportIssue: 'account',
      message: 'Too short',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      expect(fields.email?.length).toBeGreaterThan(0);
      expect(fields.message?.length).toBeGreaterThan(0);
    }
  });

  it('requires page URL and issue type for corrections', () => {
    const parsed = contactFormSchema.safeParse({
      topic: 'content-correction',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'This page has outdated rates that need review.',
    });
    expect(parsed.success).toBe(false);

    const ok = contactFormSchema.safeParse({
      topic: 'content-correction',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      pageUrl: '/reviews/example',
      correctionIssue: 'outdated',
      message: 'This page has outdated rates that need review.',
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.subject).toContain('Content correction');
    }
  });

  it('requires company for business enquiries and allows optional website', () => {
    const missingCompany = contactFormSchema.safeParse({
      topic: 'partnership',
      name: 'Ada Lovelace',
      email: 'ada@company.com',
      message: 'We would like to discuss a partnership opportunity.',
    });
    expect(missingCompany.success).toBe(false);

    const ok = contactFormSchema.safeParse({
      topic: 'partnership',
      name: 'Ada Lovelace',
      email: 'ada@company.com',
      company: 'Analytical Engines Ltd',
      message: 'We would like to discuss a partnership opportunity.',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects malformed organisation websites', () => {
    const parsed = contactFormSchema.safeParse({
      topic: 'advertising',
      name: 'Ada Lovelace',
      email: 'ada@company.com',
      company: 'Analytical Engines Ltd',
      orgWebsite: 'not-a-url',
      message: 'Interested in advertising options on Varnarc.',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('contact deep-link helpers', () => {
  it('resolves type aliases', () => {
    expect(resolveContactTopic('correction')).toBe('content-correction');
    expect(resolveContactTopic('support')).toBe('technical-support');
    expect(resolveContactTopic('provider')).toBe('service-provider');
    expect(resolveContactTopic('nope')).toBeNull();
  });

  it('sanitizes page prefills', () => {
    expect(sanitizePrefillPage('/reviews/example')).toBe('/reviews/example');
    expect(sanitizePrefillPage('https://varnarc.com/directory')).toBe('/directory');
    expect(sanitizePrefillPage('javascript:alert(1)')).toBe('');
    expect(sanitizePrefillPage('//evil.example')).toBe('');
  });

  it('maps topics to purpose and destinations', () => {
    expect(purposeKeyForTopic('content-correction')).toBe('correction');
    expect(purposeKeyForTopic('business-listing')).toBe('business');
    expect(contactDestinationKey('privacy-request')).toBe('privacy');
    expect(contactDestinationKey('technical-support')).toBe('support');
  });
});
