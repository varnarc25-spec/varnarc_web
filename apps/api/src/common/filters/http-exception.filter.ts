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

function sanitizeProviderMessage(raw: string): string {
  return raw.replace(/-----BEGIN[\s\S]*?-----END[^-]+-----/g, '[redacted]').slice(0, 800);
}

function mapUnknownException(exception: unknown): {
  status: number;
  code: string;
  message: string;
  details?: unknown;
} {
  const raw = exception as {
    message?: string;
    code?: unknown;
    meta?: unknown;
    errors?: { reason?: string }[];
  };
  const prismaCode = typeof raw.code === 'string' && /^P\d{4}$/.test(raw.code) ? raw.code : null;
  if (prismaCode === 'P2002') {
    const meta = raw.meta as { target?: string[] } | undefined;
    return {
      status: HttpStatus.CONFLICT,
      code: 'DUPLICATE_SLUG',
      message: 'A record with this slug already exists.',
      details: meta?.target?.length ? { fields: meta.target } : undefined,
    };
  }
  if (prismaCode === 'P2023') {
    return { status: HttpStatus.BAD_REQUEST, code: 'INVALID_ID', message: 'Invalid identifier.' };
  }
  if (prismaCode === 'P2022') {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'SCHEMA_MISMATCH',
      message: raw.message ?? 'Database column is missing.',
      details: { prismaCode },
    };
  }
  if (prismaCode) {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
      message: raw.message ?? 'A database error occurred.',
      details: { prismaCode },
    };
  }

  const providerMessage = sanitizeProviderMessage(raw.message ?? String(exception));
  const lower = providerMessage.toLowerCase();
  const numericCode = typeof raw.code === 'number' ? raw.code : Number(raw.code);
  const looksGcs =
    (Number.isFinite(numericCode) && numericCode >= 400 && numericCode < 600) ||
    lower.includes('google') ||
    lower.includes('storage.googleapis') ||
    lower.includes('does not have storage.') ||
    lower.includes('default credentials') ||
    lower.includes('@google-cloud/storage');

  if (looksGcs) {
    return {
      status: HttpStatus.BAD_REQUEST,
      code: 'GCS_UPLOAD_FAILED',
      message: providerMessage || 'Google Cloud Storage request failed.',
      details: {
        providerCode: raw.code ?? null,
        providerReason: raw.errors?.[0]?.reason ?? null,
        providerMessage,
      },
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: providerMessage || 'An unexpected error occurred.',
    details: { name: exception instanceof Error ? exception.name : undefined },
  };
}

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
    } else {
      const mapped = mapUnknownException(exception);
      status = mapped.status;
      code = mapped.code;
      message = mapped.message;
      details = mapped.details;
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
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
