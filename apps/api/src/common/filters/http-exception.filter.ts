import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SECURITY_EVENT_TYPES } from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import type { RequestWithMeta } from '../middleware/request-id.middleware';
import { SecurityEventsService } from '../../modules/security/security-events.service';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly securityEvents: SecurityEventsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithMeta>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'error' in body) {
        const err = (body as { error?: { code?: string; message?: string; details?: unknown } })
          .error;
        code = err?.code ?? HttpStatus[status] ?? code;
        message = err?.message ?? exception.message;
        details = err?.details;
      } else if (typeof body === 'string') {
        message = body;
        code = HttpStatus[status] ?? code;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as { message?: string | string[]; error?: string; statusCode?: number };
        message = Array.isArray(obj.message)
          ? obj.message.join('; ')
          : (obj.message ?? exception.message);
        code = obj.error ?? HttpStatus[status] ?? code;
        if (Array.isArray(obj.message)) details = obj.message;
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      (exception as { code?: string }).code === 'P2002'
    ) {
      status = HttpStatus.CONFLICT;
      code = 'DUPLICATE_SLUG';
      message = 'A record with this slug already exists.';
      const meta = (exception as { meta?: { target?: string[] } }).meta;
      if (meta?.target?.length) {
        details = { fields: meta.target };
      }
    } else if (exception instanceof Error) {
      message =
        process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    if (!(exception instanceof HttpException) || status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    this.recordSecurityEvent(request, status, code, message);

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.requestId ?? null,
      },
    });
  }

  private recordSecurityEvent(
    request: RequestWithMeta,
    status: number,
    code: string,
    message: string,
  ) {
    const user = (request as Request & { user?: CurrentUser }).user;
    const base = {
      userId: user?.id ?? null,
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent']?.toString() ?? null,
      metadata: { path: request.url, method: request.method, code },
    };

    if (status === HttpStatus.UNAUTHORIZED) {
      this.securityEvents.record({
        eventType: SECURITY_EVENT_TYPES.AUTH_FAILURE,
        severity: 'low',
        description: message,
        ...base,
      });
      return;
    }

    if (status === HttpStatus.FORBIDDEN) {
      this.securityEvents.record({
        eventType: SECURITY_EVENT_TYPES.PERMISSION_DENIED,
        severity: 'medium',
        description: message,
        ...base,
      });
      return;
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      this.securityEvents.record({
        eventType: SECURITY_EVENT_TYPES.RATE_LIMIT,
        severity: 'medium',
        description: message,
        ...base,
      });
    }
  }
}
