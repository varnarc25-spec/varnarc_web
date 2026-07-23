/**
 * Optional OpenTelemetry bootstrap. Call before NestFactory.create().
 * Enable with OTEL_ENABLED=true or OTEL_EXPORTER_OTLP_ENDPOINT.
 */
export async function initOpenTelemetry(): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  const enabled = process.env.OTEL_ENABLED === 'true' || Boolean(endpoint);
  if (!enabled) return;

  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import(
      '@opentelemetry/auto-instrumentations-node'
    );
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

    const traceExporter = new OTLPTraceExporter(
      endpoint ? { url: endpoint } : undefined,
    );

    const sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'varnarc-api',
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    await sdk.start();
    // eslint-disable-next-line no-console
    console.log('[otel] OpenTelemetry tracing enabled');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[otel] Failed to start OpenTelemetry: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
