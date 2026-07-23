'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@varnarc/ui';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/services/newsletter';
import { ApiError } from '@/services/api-client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

type NewsletterFormProps = {
  source?: string;
  variant?: 'default' | 'inline' | 'compact';
  className?: string;
};

export function NewsletterForm({
  source = 'newsletter-page',
  variant = 'default',
  className,
}: NewsletterFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await subscribeToNewsletter({ email: values.email, source });
      toast.success(result.alreadySubscribed ? 'Already subscribed' : 'Subscribed', {
        description: result.alreadySubscribed
          ? 'This email is already on our list.'
          : 'Check your inbox for updates from Varnarc.',
      });
      reset();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not subscribe. Please try again.';
      toast.error('Subscription failed', { description: message });
    }
  });

  if (variant === 'inline') {
    return (
      <form className={className} onSubmit={onSubmit} noValidate>
        <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
          <input
            type="email"
            {...register('email')}
            required
            placeholder="Enter your email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 shrink-0 bg-[#0b1f3a] px-4 text-sm font-semibold text-white hover:bg-[#122b4a] disabled:opacity-60"
          >
            {isSubmitting ? '…' : 'Subscribe'}
          </button>
        </div>
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </form>
    );
  }

  if (variant === 'compact') {
    return (
      <form className={className ?? 'mt-4 space-y-2'} onSubmit={onSubmit} noValidate>
        <label htmlFor="footer-newsletter-email" className="text-xs font-semibold text-white">
          Newsletter
        </label>
        <div className="flex gap-2">
          <input
            id="footer-newsletter-email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="shrink-0 rounded-md bg-[var(--varnarc-accent,#f97316)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? '…' : 'Join'}
          </button>
        </div>
        {errors.email ? (
          <p className="text-xs text-red-300" role="alert">
            {errors.email.message}
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Product updates and guides.{' '}
            <a href="/newsletter" className="underline hover:text-slate-300">
              Manage
            </a>
          </p>
        )}
      </form>
    );
  }

  return (
    <form className={className ?? 'flex flex-col gap-3 sm:flex-row'} onSubmit={onSubmit} noValidate>
      <div className="flex-1">
        <label htmlFor="newsletter-email" className="sr-only">
          Email
        </label>
        <input
          id="newsletter-email"
          type="email"
          {...register('email')}
          placeholder="you@example.com"
          className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Subscribing…' : 'Subscribe'}
      </Button>
    </form>
  );
}
