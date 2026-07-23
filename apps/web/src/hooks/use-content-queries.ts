'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClientFetch } from '@/services/api-client';
import type { ArticleListItem, CalculatorListItem, ReviewListItem } from '@/services/content';

export function useArticlesQuery(limit = 12) {
  return useQuery({
    queryKey: ['articles', limit],
    queryFn: async () => {
      const res = await apiClientFetch<ArticleListItem[]>(`/articles?limit=${limit}`);
      return res.data;
    },
  });
}

export function useReviewsQuery(limit = 12) {
  return useQuery({
    queryKey: ['reviews', limit],
    queryFn: async () => {
      const res = await apiClientFetch<ReviewListItem[]>(`/reviews?limit=${limit}`);
      return res.data;
    },
  });
}

export function useCalculatorsQuery(limit = 12) {
  return useQuery({
    queryKey: ['calculators', limit],
    queryFn: async () => {
      const res = await apiClientFetch<CalculatorListItem[]>(`/calculators?limit=${limit}`);
      return res.data;
    },
  });
}
