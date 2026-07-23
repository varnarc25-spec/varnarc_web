import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import {
  shouldPersistApiLog,
  type RequestWithMeta,
} from '../middleware/request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithMeta>();
    const response = http.getResponse<Response>();
    const started = Date.now();
    const { method, originalUrl } = request;
    const userId = request.user?.id ?? null;
    const requestId = request.requestId ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - started;
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} ${durationMs}ms user=${userId ?? 'anonymous'} req=${requestId}`,
          );
          this.persistLog({
            requestId,
            method,
            path: originalUrl,
            statusCode: response.statusCode,
            durationMs,
            userId,
            ipAddress: request.ip ?? null,
            userAgent: request.headers['user-agent'] ?? null,
          });
        },
        error: (err: Error & { status?: number }) => {
          const durationMs = Date.now() - started;
          const statusCode = err.status ?? response.statusCode ?? 500;
          this.logger.warn(
            `${method} ${originalUrl} error ${durationMs}ms user=${userId ?? 'anonymous'} req=${requestId} msg=${err.message}`,
          );
          this.persistLog({
            requestId,
            method,
            path: originalUrl,
            statusCode,
            durationMs,
            userId,
            ipAddress: request.ip ?? null,
            userAgent: request.headers['user-agent'] ?? null,
            errorMessage: err.message,
          });
        },
      }),
    );
  }

  private persistLog(data: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    userId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    errorMessage?: string | null;
  }) {
    if (!shouldPersistApiLog(data.path)) return;

    void this.repos.apiRequestLogs.create(data).catch(() => undefined);
  }
}
