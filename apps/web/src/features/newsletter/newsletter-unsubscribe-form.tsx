'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@varnarc/ui';
import { toast } from 'sonner';
import { unsubscribeFromNewsletter } from '@/services/newsletter';
import { ApiError } from '@/services/api-client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function NewsletterUnsubscribeForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
  });

  return (
    <form
      className="mt-8 max-w-md space-y-4"
      onSubmit={handleSubmit(async (values) => {
        try {
          await unsubscribeFromNewsletter(values.email);
          setDone(true);
          toast.success('Unsubscribed', {
            description: 'You will no longer receive newsletter emails from Varnarc.',
          });
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : 'Could not unsubscribe. Please try again.';
          toast.error('Request failed', { description: message });
        }
      })}
      noValidate
    >
      {done ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">
          If you change your mind, you can subscribe again from the{' '}
          <a href="/newsletter" className="text-[var(--varnarc-accent)] hover:underline">
            newsletter page
          </a>
          .
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="unsubscribe-email" className="mb-1 block text-sm font-medium">
              Email address
            </label>
            <input
              id="unsubscribe-email"
              type="email"
              {...register('email')}
              className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2"
              autoComplete="email"
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing…' : 'Unsubscribe'}
          </Button>
        </>
      )}
    </form>
  );
}
