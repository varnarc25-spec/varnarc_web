import Link from 'next/link';
import { fetchFinanceEntityReviews } from '@/services/finance';

export async function FinanceReviewsSection({
  entity,
  id,
}: {
  entity: 'loans' | 'credit-cards' | 'insurance' | 'investments';
  id: string;
}) {
  const { data: reviews } = await fetchFinanceEntityReviews(entity, id);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-extrabold text-[#0b1f3a]">Reviews</h2>
      {reviews.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <Link
              key={review.id}
              href={`/reviews/${review.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#f97316]"
            >
              <div className="font-semibold text-[#0b1f3a]">{review.title}</div>
              {review.overallScore != null ? (
                <div className="mt-1 text-sm text-slate-600">Score: {review.overallScore}</div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">No reviews yet</p>
      )}
    </section>
  );
}
