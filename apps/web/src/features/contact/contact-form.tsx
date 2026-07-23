'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@varnarc/ui';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async () => {
        await new Promise((r) => setTimeout(r, 400));
        toast.success('Message queued', {
          description: 'Contact API / email delivery will be wired via Resend.',
        });
        reset();
      })}
      noValidate
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-[var(--varnarc-ink)]">
          Name
        </label>
        <input
          id="name"
          {...register('name')}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--varnarc-accent)]"
          autoComplete="name"
        />
        {errors.name ? (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--varnarc-ink)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--varnarc-accent)]"
          autoComplete="email"
        />
        {errors.email ? (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-[var(--varnarc-ink)]">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register('message')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
          className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--varnarc-accent)]"
        />
        {errors.message ? (
          <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.message.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
