'use client';

import { SimpleBarChart } from '@/components/shared/simple-chart';

export function RatesChart({
  data,
}: {
  data: Array<{ label: string; rate: number }>;
}) {
  if (!data.length) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-extrabold text-[#0b1f3a]">Rate comparison chart</h2>
      <SimpleBarChart data={data} xKey="label" yKey="rate" height={280} />
    </div>
  );
}
