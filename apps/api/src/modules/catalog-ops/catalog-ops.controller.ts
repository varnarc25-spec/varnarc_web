import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  catalogImportQuerySchema,
  catalogReindexSchema,
  type CatalogImportQuery,
  type CatalogReindexInput,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok } from '../../common/utils/response';
import { CatalogOpsService } from './catalog-ops.service';

const MAX_MB = Number(process.env.CATALOG_IMPORT_MAX_MB ?? 50);

@ApiTags('catalog')
@Controller('catalog/ops')
export class CatalogOpsController {
  constructor(private readonly service: CatalogOpsService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  @ApiOperation({ summary: 'Catalog import ops overview' })
  overview() {
    return ok(this.service.overview());
  }

  @Get('counts')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  @ApiOperation({ summary: 'Published catalog row counts by vertical' })
  async counts() {
    return ok(await this.service.counts());
  }

  @Post('import')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_MB * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Batched CSV import for finance/construction/automobile catalogs' })
  async importCsv(
    @Query(new ZodValidationPipe(catalogImportQuerySchema)) query: CatalogImportQuery,
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      return ok({ imported: 0, error: 'No file uploaded' });
    }
    return ok(
      await this.service.importBatched(query, file.buffer.toString('utf8'), user.id),
    );
  }

  @Post('reindex')
  @RequirePermissions(PERMISSIONS.SEARCH_REINDEX)
  @ApiOperation({ summary: 'Reindex search after large catalog imports' })
  async reindex(
    @Body(new ZodValidationPipe(catalogReindexSchema)) body: CatalogReindexInput,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.reindexCatalog(body, user.id));
  }
}
