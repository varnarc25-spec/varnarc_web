import { Controller, Get, Header, HttpCode, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

const PUBLIC_SITE = 'https://varnarc.com/';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** api.varnarc.com/ is not a public page — send crawlers to the website. */
  @Public()
  @Get()
  @HttpCode(301)
  @Header('Location', PUBLIC_SITE)
  root() {
    return '';
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots() {
    return 'User-agent: *\nDisallow: /\n';
  }

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
