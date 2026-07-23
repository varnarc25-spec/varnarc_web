import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export type RequestWithMeta = Request & {
  requestId?: string;
  user?: { id?: string };
};

const SKIP_LOG_PREFIXES = [
  '/api/v1/health',
  '/health',
  '/ready',
  '/docs',
  '/api/v1/docs',
  '/metrics',
  '/api/v1/metrics',
  '/metrics/prometheus',
  '/api/v1/metrics/prometheus',
];

export function shouldPersistApiLog(path: string) {
  return !SKIP_LOG_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function requestIdMiddleware(req: RequestWithMeta, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const requestId = typeof incoming === 'string' && incoming.trim() ? incoming : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
