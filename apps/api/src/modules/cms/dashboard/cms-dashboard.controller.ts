import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator';
import { ok } from '../../../common/utils/response';
import { CmsDashboardService } from './cms-dashboard.service';

@ApiTags('cms-dashboard')
@Controller('cms/dashboard')
export class CmsDashboardController {
  constructor(private readonly service: CmsDashboardService) {}

  @Get('summary')
  @RequirePermissions(PERMISSIONS.PAGE_VIEW)
  async summary() {
    return ok(await this.service.summary());
  }
}
