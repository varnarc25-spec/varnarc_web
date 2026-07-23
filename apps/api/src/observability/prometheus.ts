import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const prometheusRegistry = new Registry();

collectDefaultMetrics({ register: prometheusRegistry, prefix: 'varnarc_' });

export const httpRequestDuration = new Histogram({
  name: 'varnarc_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [prometheusRegistry],
});

export const httpRequestsTotal = new Counter({
  name: 'varnarc_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [prometheusRegistry],
});

export function isPrometheusEnabled() {
  return (
    process.env.PROMETHEUS_ENABLED === 'true' ||
    process.env.NODE_ENV === 'production'
  );
}

export async function renderPrometheusMetrics() {
  return prometheusRegistry.metrics();
}

export function prometheusContentType() {
  return prometheusRegistry.contentType;
}
