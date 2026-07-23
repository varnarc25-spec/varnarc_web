import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import {
  httpRequestDuration,
  httpRequestsTotal,
  isPrometheusEnabled,
} from '../../observability/prometheus';

@Injectable()
export class PrometheusInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!isPrometheusEnabled()) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const elapsedNs = Number(process.hrtime.bigint() - start);
        const seconds = elapsedNs / 1e9;
        const route = req.route?.path ?? req.path ?? 'unknown';
        const labels = {
          method: req.method,
          route,
          status_code: String(res.statusCode),
        };
        httpRequestDuration.observe(labels, seconds);
        httpRequestsTotal.inc(labels);
      }),
    );
  }
}
