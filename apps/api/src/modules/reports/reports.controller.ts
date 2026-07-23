import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('users.csv')
  @RequirePermissions(PERMISSIONS.REPORTS_EXPORT)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  async usersCsv(@Query('search') search?: string) {
    const csv = await this.service.usersCsv(search);
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }
}
