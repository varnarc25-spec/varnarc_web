import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { RequestWithMeta } from '../middleware/request-id.middleware';

/**
 * Ensures responses follow { success, data?, meta? } when handlers return plain data.
 * Handlers that already return { success: true, ... } get requestId + timestamp meta merged in.
 * StreamableFile (CSV/PDF downloads) is passed through untouched.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithMeta>();

    return next.handle().pipe(
      map((body) => {
        if (body instanceof StreamableFile) {
          return body;
        }

        const meta = {
          timestamp: new Date().toISOString(),
          requestId: request.requestId ?? null,
        };

        if (
          body &&
          typeof body === 'object' &&
          ('success' in body || 'error' in body)
        ) {
          if ('success' in body && body.success === true) {
            const existing = body as { success: true; data?: unknown; meta?: Record<string, unknown> };
            return {
              ...existing,
              meta: { ...meta, ...(existing.meta ?? {}) },
            };
          }
          return body;
        }

        return { success: true, data: body ?? null, meta };
      }),
    );
  }
}
