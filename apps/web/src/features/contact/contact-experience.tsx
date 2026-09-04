'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  Handshake,
  LifeBuoy,
  Lock,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import {
  BUSINESS_ENQUIRY_TYPES,
  CONTACT_PURPOSE_CARDS,
  CONTACT_TOPICS,
  CORRECTION_ISSUE_TYPES,
  SUPPORT_ISSUE_TYPES,
  contactFormSchema,
  isBusinessTopic,
  isCorrectionTopic,
  isSupportTopic,
  purposeKeyForTopic,
  type ContactFormValues,
  type ContactPurposeKey,
  type ContactTopic,
} from '@/lib/contact';

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30';

const fieldErrorClass =
  'mt-1.5 min-h-11 w-full rounded-md border border-red-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30';

const CARD_ICONS = {
  general: MessageCircle,
  correction: BookOpenCheck,
  business: Handshake,
  support: LifeBuoy,
} as const;

const CARD_TONES = {
  general: 'bg-blue-50 text-blue-600',
  correction: 'bg-emerald-50 text-emerald-600',
  business: 'bg-violet-50 text-violet-600',
  support: 'bg-orange-50 text-orange-500',
} as const;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-5 text-red-700"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function ContactExperience({
  publicContactEmail,
  initialTopic = 'general',
  initialPageUrl = '',
}: {
  publicContactEmail?: string | null;
  initialTopic?: ContactTopic;
  initialPageUrl?: string;
}) {
  const formSectionRef = useRef<HTMLElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLSelectElement | null>(null);
  const pageUrlRef = useRef<HTMLInputElement | null>(null);
  const formStartedAt = useRef(Date.now());
  const trackedStart = useRef(false);
  const honeypotId = useId();

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState(
    'Please try again. If the problem continues, use another available contact route.',
  );
  const [selectedPurpose, setSelectedPurpose] = useState<ContactPurposeKey>(() =>
    purposeKeyForTopic(initialTopic),
  );

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      topic: initialTopic,
      name: '',
      email: '',
      subject: '',
      message: '',
      faxNumber: '',
      formStartedAt: formStartedAt.current,
      pageUrl: initialPageUrl,
      correctionIssue: '',
      supportIssue: '',
      company: '',
      orgWebsite: '',
      supportFeature: '',
    },
  });

  const topic = (useWatch({ control, name: 'topic' }) as ContactTopic) || initialTopic;
  const purpose = purposeKeyForTopic(topic);
  const showCorrection = isCorrectionTopic(topic);
  const showSupport = isSupportTopic(topic);
  const showBusiness = isBusinessTopic(topic);
  const showGeneral = !showCorrection && !showSupport && !showBusiness;

  const { ref: topicFieldRef, ...topicField } = register('topic');
  const { ref: pageUrlFieldRef, ...pageUrlField } = register('pageUrl');

  useEffect(() => {
    setSelectedPurpose(purposeKeyForTopic(initialTopic));
  }, [initialTopic]);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  function trackContact(action: string, meta?: Record<string, unknown>) {
    trackAnalyticsEvent({
      eventType: 'contact_form',
      metadata: { action, topic, purpose, ...meta },
    });
  }

  function markFormStarted() {
    if (trackedStart.current) return;
    trackedStart.current = true;
    trackContact('contact_form_started');
  }

  function scrollToForm(focus: 'topic' | 'pageUrl' = 'topic') {
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    formSectionRef.current?.scrollIntoView({ behavior, block: 'start' });
    window.setTimeout(
      () => {
        if (focus === 'pageUrl') pageUrlRef.current?.focus();
        else topicRef.current?.focus();
      },
      prefersReducedMotion() ? 0 : 220,
    );
  }

  function selectPurpose(key: ContactPurposeKey, options?: { focusPageUrl?: boolean }) {
    const card = CONTACT_PURPOSE_CARDS.find((item) => item.key === key);
    if (!card) return;
    setSelectedPurpose(key);
    setValue('topic', card.topic, { shouldValidate: true, shouldDirty: true });
    setStatus('idle');
    trackContact('contact_type_selected', { purpose: key });
    if (key === 'correction' && options?.focusPageUrl) {
      scrollToForm('pageUrl');
    } else {
      scrollToForm('topic');
    }
  }

  function onTopicChange(next: ContactTopic) {
    setValue('topic', next, { shouldValidate: true });
    setSelectedPurpose(purposeKeyForTopic(next));
    trackContact('contact_type_selected', { purpose: purposeKeyForTopic(next) });
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setStatus('idle');
      trackContact('contact_form_submitted');
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...values,
            formStartedAt: formStartedAt.current,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          setErrorMessage(
            data.message ||
              'Please try again. If the problem continues, use another available contact route.',
          );
          setStatus('error');
          trackContact('contact_form_error', { code: data.error || String(res.status) });
          return;
        }
        setStatus('success');
        trackContact('contact_form_success');
      } catch {
        setErrorMessage(
          'Please try again. If the problem continues, use another available contact route.',
        );
        setStatus('error');
        trackContact('contact_form_error', { code: 'network' });
      }
    },
    (fieldErrors) => {
      const order: Array<keyof ContactFormValues> = [
        'topic',
        'name',
        'email',
        'company',
        'orgWebsite',
        'pageUrl',
        'correctionIssue',
        'supportIssue',
        'supportFeature',
        'subject',
        'message',
      ];
      const first = order.find((key) => fieldErrors[key]);
      if (first) setFocus(first);
    },
  );

  function sendAnother() {
    reset({
      topic: initialTopic,
      name: '',
      email: '',
      subject: '',
      message: '',
      faxNumber: '',
      formStartedAt: Date.now(),
      pageUrl: initialPageUrl,
      correctionIssue: '',
      supportIssue: '',
      company: '',
      orgWebsite: '',
      supportFeature: '',
    });
    formStartedAt.current = Date.now();
    trackedStart.current = false;
    setSelectedPurpose(purposeKeyForTopic(initialTopic));
    setStatus('idle');
  }

  return (
    <>
      <section aria-labelledby="contact-purpose-heading" className="mt-8 sm:mt-10">
        <h2 id="contact-purpose-heading" className="sr-only">
          Choose how we can help
        </h2>
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="group"
          aria-label="Enquiry type"
        >
          {CONTACT_PURPOSE_CARDS.map((item) => {
            const Icon = CARD_ICONS[item.key];
            const selected = selectedPurpose === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={selected}
                onClick={() => selectPurpose(item.key)}
                className={`min-h-11 rounded-xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5 ${
                  selected
                    ? 'border-blue-400 bg-blue-50/70 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-lg ${CARD_TONES[item.key]}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  {selected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      <Check className="h-3 w-3" aria-hidden />
                      Selected
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-950 sm:text-[15px]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-600 sm:text-sm">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.9fr)] lg:items-start">
        <article
          ref={formSectionRef}
          id="contact-form"
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Send us a message</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tell us what you need help with and provide enough detail for us to understand your
            enquiry.
          </p>

          <div aria-live="polite" className="mt-4">
            {status === 'success' ? (
              <div
                ref={successRef}
                role="status"
                tabIndex={-1}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <h3 className="text-base font-bold text-emerald-900">Message received</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  We&apos;ve received your enquiry. If a response is required, we&apos;ll reply
                  using the email address you provided.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                  >
                    Back to Varnarc
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={sendAnother}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : null}
            {status === 'error' ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
                <p className="flex items-center gap-2 text-sm font-bold text-red-900">
                  <AlertCircle className="h-4 w-4" aria-hidden />
                  We couldn&apos;t send your message
                </p>
                <p className="mt-1 text-[13px] leading-5 text-red-800">{errorMessage}</p>
              </div>
            ) : null}
          </div>

          {status !== 'success' ? (
            <form
              className="mt-5 space-y-4"
              onSubmit={onSubmit}
              noValidate
              onFocusCapture={markFormStarted}
              aria-busy={isSubmitting}
            >
              <div className="sr-only" aria-hidden>
                <label htmlFor={honeypotId}>Fax number</label>
                <input
                  id={honeypotId}
                  tabIndex={-1}
                  autoComplete="off"
                  {...register('faxNumber')}
                />
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-semibold text-slate-800">
                  What can we help with? <span className="text-red-600">*</span>
                </label>
                <select
                  id="topic"
                  {...topicField}
                  ref={(el) => {
                    topicFieldRef(el);
                    topicRef.current = el;
                  }}
                  onChange={(e) => onTopicChange(e.target.value as ContactTopic)}
                  aria-invalid={Boolean(errors.topic)}
                  aria-describedby={errors.topic ? 'topic-error' : undefined}
                  className={errors.topic ? fieldErrorClass : fieldClass}
                  required
                >
                  {CONTACT_TOPICS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <FieldError id="topic-error" message={errors.topic?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-800">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="name"
                    autoComplete="name"
                    {...register('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={errors.name ? fieldErrorClass : fieldClass}
                    required
                  />
                  <FieldError id="name-error" message={errors.name?.message} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                    {showBusiness ? 'Work email' : 'Email address'}{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error email-help' : 'email-help'}
                    className={errors.email ? fieldErrorClass : fieldClass}
                    required
                  />
                  <p id="email-help" className="mt-1.5 text-[13px] leading-5 text-slate-500">
                    We&apos;ll use this only to respond to your enquiry.
                  </p>
                  <FieldError id="email-error" message={errors.email?.message} />
                </div>
              </div>

              {showBusiness ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-slate-800">
                      Company / organisation <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="company"
                      autoComplete="organization"
                      {...register('company')}
                      aria-invalid={Boolean(errors.company)}
                      aria-describedby={errors.company ? 'company-error' : undefined}
                      className={errors.company ? fieldErrorClass : fieldClass}
                      required
                    />
                    <FieldError id="company-error" message={errors.company?.message} />
                  </div>
                  <div>
                    <label
                      htmlFor="orgWebsite"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Website <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <input
                      id="orgWebsite"
                      type="url"
                      autoComplete="url"
                      placeholder="https://"
                      {...register('orgWebsite')}
                      aria-invalid={Boolean(errors.orgWebsite)}
                      aria-describedby={errors.orgWebsite ? 'orgWebsite-error' : undefined}
                      className={errors.orgWebsite ? fieldErrorClass : fieldClass}
                    />
                    <FieldError id="orgWebsite-error" message={errors.orgWebsite?.message} />
                  </div>
                </div>
              ) : null}

              {showBusiness ? (
                <div>
                  <label
                    htmlFor="business-enquiry"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Enquiry type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="business-enquiry"
                    value={
                      BUSINESS_ENQUIRY_TYPES.find(
                        (item) => item.topic === topic && item.value !== 'other-commercial',
                      )?.value ?? 'partnership'
                    }
                    onChange={(e) => {
                      const option = BUSINESS_ENQUIRY_TYPES.find(
                        (item) => item.value === e.target.value,
                      );
                      if (option) onTopicChange(option.topic);
                    }}
                    className={fieldClass}
                  >
                    {BUSINESS_ENQUIRY_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {showCorrection ? (
                <>
                  <div>
                    <label htmlFor="pageUrl" className="block text-sm font-semibold text-slate-800">
                      Page URL <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="pageUrl"
                      type="text"
                      inputMode="url"
                      placeholder="/reviews/example or https://…"
                      {...pageUrlField}
                      ref={(el) => {
                        pageUrlFieldRef(el);
                        pageUrlRef.current = el;
                      }}
                      aria-invalid={Boolean(errors.pageUrl)}
                      aria-describedby={
                        errors.pageUrl ? 'pageUrl-error pageUrl-help' : 'pageUrl-help'
                      }
                      className={errors.pageUrl ? fieldErrorClass : fieldClass}
                      required
                    />
                    <p id="pageUrl-help" className="mt-1.5 text-[13px] leading-5 text-slate-500">
                      Paste the Varnarc page where you found the issue.
                    </p>
                    <FieldError id="pageUrl-error" message={errors.pageUrl?.message} />
                  </div>
                  <div>
                    <label
                      htmlFor="correctionIssue"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Issue type <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="correctionIssue"
                      {...register('correctionIssue')}
                      aria-invalid={Boolean(errors.correctionIssue)}
                      aria-describedby={
                        errors.correctionIssue ? 'correctionIssue-error' : undefined
                      }
                      className={errors.correctionIssue ? fieldErrorClass : fieldClass}
                      required
                    >
                      <option value="">Select an issue type</option>
                      {CORRECTION_ISSUE_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <FieldError
                      id="correctionIssue-error"
                      message={errors.correctionIssue?.message}
                    />
                  </div>
                </>
              ) : null}

              {showSupport ? (
                <>
                  <div>
                    <label
                      htmlFor="supportIssue"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Issue type <span className="text-red-600">*</span>
                    </label>
                    <select
                      id="supportIssue"
                      {...register('supportIssue')}
                      aria-invalid={Boolean(errors.supportIssue)}
                      aria-describedby={errors.supportIssue ? 'supportIssue-error' : undefined}
                      className={errors.supportIssue ? fieldErrorClass : fieldClass}
                      required
                    >
                      <option value="">Select an issue type</option>
                      {SUPPORT_ISSUE_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <FieldError id="supportIssue-error" message={errors.supportIssue?.message} />
                  </div>
                  <div>
                    <label
                      htmlFor="supportFeature"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Page / feature <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <input
                      id="supportFeature"
                      placeholder="e.g. EMI calculator, directory search"
                      {...register('supportFeature')}
                      className={fieldClass}
                    />
                  </div>
                </>
              ) : null}

              {showGeneral ? (
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-slate-800">
                    Subject <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="subject"
                    {...register('subject')}
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    className={errors.subject ? fieldErrorClass : fieldClass}
                    required
                  />
                  <FieldError id="subject-error" message={errors.subject?.message} />
                </div>
              ) : null}

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-800">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="message"
                  rows={6}
                  {...register('message')}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? 'message-error message-privacy' : 'message-privacy'
                  }
                  className={`${errors.message ? fieldErrorClass : fieldClass} min-h-36 py-2.5 leading-6`}
                  required
                />
                <FieldError id="message-error" message={errors.message?.message} />
                <p
                  id="message-privacy"
                  className="mt-2 flex items-start gap-2 text-[13px] leading-5 text-slate-500"
                >
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Please don&apos;t include passwords, bank details or other sensitive personal
                  information.
                </p>
              </div>

              <p className="text-[13px] leading-5 text-slate-500">
                Your message will be used to review and respond to your enquiry in accordance with
                our{' '}
                <Link href="/privacy" className="font-semibold text-blue-700 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? 'Sending...' : 'Send message'}
                {!isSubmitting ? (
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                ) : null}
                {isSubmitting ? <span className="sr-only">Please wait</span> : null}
              </button>
            </form>
          ) : null}
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-slate-950">Contact information</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose the most relevant contact route so we can understand your enquiry quickly.
          </p>

          <div className="mt-5 space-y-5 text-[13px] leading-5 text-slate-600 sm:text-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-950">General enquiries</h3>
              <p className="mt-1">Questions about Varnarc, tools, guides or the platform.</p>
              {publicContactEmail ? (
                <a
                  href={`mailto:${publicContactEmail}`}
                  className="mt-1 inline-block font-semibold text-blue-700 hover:underline"
                >
                  {publicContactEmail}
                </a>
              ) : null}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950">Business &amp; partnerships</h3>
              <p className="mt-1">
                Partnerships, advertising, provider listings and other commercial enquiries.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950">Content corrections</h3>
              <p className="mt-1">
                Include the page URL and explain what appears inaccurate, outdated or incomplete.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950">Support</h3>
              <p className="mt-1">Help with your account or Varnarc tools.</p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-950">When will we reply?</h3>
            <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm">
              We aim to review enquiries within 2 business days. Complex content corrections or
              support requests may require additional time.
            </p>
          </div>

          <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-5 text-[13px] leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            <span>
              Your message will be used to review and respond to your enquiry in accordance with our{' '}
              <Link href="/privacy" className="font-semibold text-blue-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </p>
        </aside>
      </section>

      <section className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-5 sm:mt-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-emerald-600">
              <BadgeCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Found something that needs correcting?
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600 sm:text-sm">
                Accuracy matters to us. If you find outdated, incomplete or incorrect information,
                send us the page URL and details so our editorial team can review it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              trackContact('contact_correction_clicked');
              selectPurpose('correction', { focusPageUrl: true });
            }}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
          >
            Report a correction
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </section>
    </>
  );
}
