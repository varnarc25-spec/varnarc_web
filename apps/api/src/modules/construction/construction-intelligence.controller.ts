import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import { RATE_IMPORT_CSV_HEADER } from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ok } from '../../common/utils/response';
import { ConstructionIntelligenceService } from './construction-intelligence.service';

@ApiTags('construction-intelligence')
@ApiBearerAuth()
@Controller('construction/intelligence')
export class ConstructionIntelligenceController {
  constructor(private readonly intelligence: ConstructionIntelligenceService) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Construction intelligence admin dashboard' })
  async dashboard() {
    return ok(await this.intelligence.dashboard());
  }

  @Get('sources')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async sources() {
    return ok(await this.intelligence.listSources());
  }

  @Get('rates')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_RATES_VIEW)
  async rates(
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('sourceType') sourceType?: string,
    @Query('confidence') confidence?: string,
    @Query('status') status?: string,
  ) {
    return ok(
      await this.intelligence.listMaterialRates({
        state,
        city,
        sourceType: sourceType as never,
        confidence,
        status,
      }),
    );
  }

  @Get('masters')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async masters() {
    return ok(await this.intelligence.listMasters());
  }

  @Get('reviews')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_RATES_VIEW)
  async reviews() {
    return ok(await this.intelligence.listReviews());
  }

  @Get('quotations')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_RATES_VIEW)
  async quotations() {
    return ok(await this.intelligence.listQuotations());
  }

  @Get('import/template')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_IMPORT)
  async importTemplate() {
    return ok({ csv: RATE_IMPORT_CSV_HEADER, filename: 'construction-rates-template.csv' });
  }

  @Post('import')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_IMPORT)
  async importRates(@CurrentUserDecorator() user: CurrentUser, @Body() body: { csv?: string }) {
    return ok(await this.intelligence.importCsv(body.csv ?? '', user.id));
  }

  @Get('history/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_RATES_VIEW)
  async history(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.intelligence.priceHistory(id));
  }

  @Public()
  @Get('resolve')
  @ApiOperation({
    summary: 'Resolve a material rate for a location without inventing official prices',
  })
  async resolve(@Query('material') material?: string, @Query('location') location?: string) {
    if (!material) return ok({ resolved: null, error: 'material slug required' });
    return ok(
      await this.intelligence.resolveMaterialRate({
        materialSlug: material,
        locationSlug: location,
      }),
    );
  }
}
