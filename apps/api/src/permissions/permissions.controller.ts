import { Controller, Get, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '@varnarc/auth';
import { paginationQuerySchema } from '@varnarc/validation';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLE_VIEW)
  async list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: unknown) {
    const result = await this.permissionsService.list(paginationQuerySchema.parse(query));
    return { success: true, ...result };
  }
}
