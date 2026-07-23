import { z } from 'zod';

export const webVitalsMetricNames = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;

export const recordWebVitalsSchema = z.object({
  metrics: z
    .array(
      z.object({
        name: z.enum(webVitalsMetricNames),
        value: z.number().min(0),
        rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
        navigationType: z.string().max(40).optional(),
      }),
    )
    .min(1)
    .max(10),
  path: z.string().max(500),
  sessionId: z.string().max(120).optional(),
  connectionType: z.string().max(40).optional(),
});

export type RecordWebVitalsInput = z.infer<typeof recordWebVitalsSchema>;
