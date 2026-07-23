import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { Request } from 'express';
import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  securityEventsQuerySchema,
  revokeSessionsSchema,
} from '@varnarc/validation';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import type { CurrentUser } from '@varnarc/types';
import { SecurityService } from './security.service';

const auditQuerySchema = cursorPaginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  entity: z.string().max(120).optional(),
  action: z.string().max(120).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const sessionsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
});

@ApiTags('security')
@Controller('security')
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.SECURITY_VIEW)
  async overview() {
    return ok(await this.service.overview());
  }

  @Get('audit-logs')
  @RequirePermissions(PERMISSIONS.SECURITY_VIEW)
  async auditLogs(@Query(new ZodValidationPipe(auditQuerySchema)) query: z.infer<typeof auditQuerySchema>) {
    return okCursor(await this.service.listAuditLogs(query));
  }

  @Get('events')
  @RequirePermissions(PERMISSIONS.SECURITY_VIEW)
  async events(
    @Query(new ZodValidationPipe(securityEventsQuerySchema)) query: z.infer<typeof securityEventsQuerySchema>,
  ) {
    return okCursor(await this.service.listEvents(query));
  }

  @Get('sessions')
  @RequirePermissions(PERMISSIONS.SECURITY_VIEW)
  async sessions(@Query(new ZodValidationPipe(sessionsQuerySchema)) query: z.infer<typeof sessionsQuerySchema>) {
    return ok(await this.service.listSessions(query.userId));
  }

  @Post('revoke-sessions')
  @RequirePermissions(PERMISSIONS.SECURITY_MANAGE)
  async revokeSessions(
    @Body(new ZodValidationPipe(revokeSessionsSchema)) body: z.infer<typeof revokeSessionsSchema>,
    @CurrentUserDecorator() actor: CurrentUser,
    @Req() req: Request,
  ) {
    return ok(
      await this.service.revokeSessions({
        ...body,
        actorId: actor.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']?.toString(),
      }),
    );
  }
}
