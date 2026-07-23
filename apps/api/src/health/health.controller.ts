import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('health')
  health() {
    return { success: true, data: this.healthService.getHealth() };
  }

  @Public()
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const data = await this.healthService.getReadiness();
    if (!this.healthService.isReady(data)) {
      res.status(503);
    }
    return { success: true, data };
  }
}
