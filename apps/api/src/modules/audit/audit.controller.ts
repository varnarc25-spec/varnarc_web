import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { z } from 'zod';
import { cursorPaginationQuerySchema } from '@varnarc/validation';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { okCursor } from '../../common/utils/response';
import { AuditService } from './audit.service';

const auditQuerySchema = cursorPaginationQuerySchema.extend({
  userId: z.string().uuid().optional(),
  entity: z.string().max(120).optional(),
  action: z.string().max(120).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

type AuditQuery = z.infer<typeof auditQuerySchema>;

@ApiTags('audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_VIEW)
  async list(@Query(new ZodValidationPipe(auditQuerySchema)) query: AuditQuery) {
    return okCursor(await this.service.list(query));
  }
}
