'use client';

import Link from 'next/link';
import { Spinner } from '@/components/shared/spinner';
import { ErrorState } from '@/components/shared/error-state';
import { ArticleCard } from '@/components/business/article-card';
import { articleCardPropsFromListItem } from '@/services/content';
import { useArticlesQuery } from '@/hooks/use-content-queries';

/** Client-side article grid powered by TanStack Query (caching + refetch). */
export function ArticlesQueryGrid({ limit = 6 }: { limit?: number }) {
  const { data, isLoading, isError, refetch, isFetching } = useArticlesQuery(limit);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Could not load articles" onRetry={() => void refetch()} />;
  }

  if (!data?.length) {
    return <p className="text-sm text-slate-500">No articles available yet.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{isFetching ? 'Refreshing…' : 'Live from API'}</p>
        <Link href="/articles" className="text-sm font-semibold text-[#f97316] hover:underline">
          View all
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((a) => (
          <ArticleCard key={a.id} {...articleCardPropsFromListItem(a)} />
        ))}
      </div>
    </div>
  );
}
