import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ok } from '../../common/utils/response';
import { MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  @ApiOperation({ summary: 'Unified monitoring dashboard data' })
  async overview() {
    return ok(await this.service.overview());
  }

  @Get('probes')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  @ApiOperation({ summary: 'Live liveness and readiness probes' })
  async probes() {
    return ok(await this.service.probes());
  }
}
