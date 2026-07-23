import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ok } from '../../common/utils/response';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  async summary() {
    return ok(await this.service.summary());
  }
}
