'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  height = 240,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  height?: number;
}) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey={yKey} fill="#f97316" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped bars — e.g. budget vs spent vs committed by category. */
export function GroupedBarChart({
  data,
  xKey,
  series,
  height = 280,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; color: string; name?: string }>;
  height?: number;
}) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={70}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name ?? s.key}
              fill={s.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleLineChart({
  data,
  xKey,
  series,
  height = 280,
  showDots = false,
  connectNulls = false,
  onPointClick,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; color: string; name?: string }>;
  height?: number;
  /** Show discrete observation markers (preferred for sparse price series). */
  showDots?: boolean;
  /** When false, gaps are not filled — avoids inventing mid-gap values. */
  connectNulls?: boolean;
  onPointClick?: (payload: Record<string, string | number>) => void;
}) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          onClick={(state) => {
            const active = state as {
              activePayload?: Array<{ payload?: Record<string, string | number> }>;
            };
            const payload = active?.activePayload?.[0]?.payload;
            if (payload && onPointClick) onPointClick(payload);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.key}
              type="linear"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={showDots ? { r: 4, strokeWidth: 1 } : false}
              activeDot={showDots ? { r: 6 } : undefined}
              connectNulls={connectNulls}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
