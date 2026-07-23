'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type UserReview = {
  id: string;
  rating: number | string;
  title?: string | null;
  comment?: string | null;
  user?: { displayName?: string | null; email?: string | null } | null;
  _count?: { helpfulVotes?: number };
};

type Props = {
  entityType: string;
  entityId: string;
  initialReviews?: UserReview[];
  averageRating?: number | string | null;
  totalRatings?: number;
};

export function UserReviewWidget({
  entityType,
  entityId,
  initialReviews = [],
  averageRating,
  totalRatings = 0,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(4);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/reviews/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, rating, title: title || undefined, comment: comment || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string }; data?: UserReview };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to submit review');
      setMessage('Thanks! Your review was submitted for moderation.');
      setTitle('');
      setComment('');
      if (json.data) setReviews((prev) => [json.data!, ...prev]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">User ratings</h2>
      {totalRatings > 0 ? (
        <p className="mt-1 text-sm text-slate-600">
          {Number(averageRating ?? 0).toFixed(1)} / 5 · {totalRatings} rating{totalRatings === 1 ? '' : 's'}
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">No user ratings yet.</p>
      )}

      <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <h3 className="text-sm font-medium text-slate-800">Write a review</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Rating
            <select
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <input
            className="mt-6 h-10 rounded-md border border-slate-200 bg-white px-3 text-sm sm:mt-0"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2"
            placeholder="Share your experience"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Button type="button" disabled={loading} onClick={() => void submit()}>
            {loading ? 'Submitting…' : 'Submit review'}
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </div>

      <ul className="mt-6 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-800">
                {review.user?.displayName || review.user?.email || 'User'}
              </span>
              <span className="text-sm text-amber-600">{Number(review.rating).toFixed(1)} / 5</span>
            </div>
            {review.title ? <p className="mt-1 font-medium text-slate-800">{review.title}</p> : null}
            {review.comment ? <p className="mt-1 text-sm text-slate-600">{review.comment}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
