'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@varnarc/ui';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

const schema = z.object({
  q: z.string().min(1, 'Enter a search term').max(200),
});

type FormValues = z.infer<typeof schema>;

export function SearchForm({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { q: initialQuery },
  });

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={handleSubmit((values) => {
        const q = values.q.trim();
        trackAnalyticsEvent({
          eventType: 'search',
          metadata: { query: q },
        });
        router.push(`/search?q=${encodeURIComponent(q)}`);
      })}
      role="search"
    >
      <div className="flex-1">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input
          id="q"
          {...register('q')}
          className="w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-[var(--varnarc-ink)] outline-none focus:ring-2 focus:ring-[var(--varnarc-brand)]"
          placeholder="Search articles and pages…"
          autoComplete="off"
        />
        {errors.q ? (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errors.q.message}
          </p>
        ) : null}
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}
