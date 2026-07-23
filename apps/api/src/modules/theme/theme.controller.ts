import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createThemeSchema,
  cursorPaginationQuerySchema,
  importThemeSchema,
  updateThemeSchema,
  upsertThemeAssetSchema,
  type CreateThemeInput,
  type CursorPaginationQuery,
  type ImportThemeInput,
  type UpdateThemeInput,
  type UpsertThemeAssetInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { z } from 'zod';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { ThemeService } from './theme.service';

@ApiTags('theme')
@Controller('theme')
export class ThemeController {
  constructor(private readonly service: ThemeService) {}

  /** Active theme (supports scheduled seasonal override + optional tenantKey). */
  @Public()
  @Get()
  async getActive(
    @Query(new ZodValidationPipe(z.object({ tenantKey: z.string().max(80).optional() })))
    query: { tenantKey?: string },
  ) {
    return ok(await this.service.getActive(query.tenantKey));
  }

  @Put()
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async updateActive(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateThemeSchema)) body: UpdateThemeInput,
  ) {
    return ok(await this.service.updateActive(body, user.id));
  }

  @Public()
  @Get('marketplace')
  async marketplace(
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listMarketplace(query));
  }

  @Get('presets')
  @RequirePermissions(PERMISSIONS.THEME_VIEW)
  async listPresets(
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery,
  ) {
    return okCursor(await this.service.listPresets(query));
  }

  @Post('presets')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async createPreset(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createThemeSchema)) body: CreateThemeInput,
  ) {
    return ok(await this.service.createPreset(body, user.id));
  }

  @Post('presets/import')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async importPreset(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(importThemeSchema)) body: ImportThemeInput,
  ) {
    return ok(await this.service.importPreset(body, user.id));
  }

  @Get('presets/:id')
  @RequirePermissions(PERMISSIONS.THEME_VIEW)
  async getPreset(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getPreset(id));
  }

  @Get('presets/:id/export')
  @RequirePermissions(PERMISSIONS.THEME_VIEW)
  async exportPreset(@Param('id', ParseUUIDPipe) id: string) {
    const theme = await this.service.getPreset(id);
    return ok(this.service.exportPreset(theme as Record<string, unknown>));
  }

  @Put('presets/:id')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async updatePreset(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateThemeSchema)) body: UpdateThemeInput,
  ) {
    return ok(await this.service.updatePreset(id, body, user.id));
  }

  @Post('presets/:id/publish')
  @RequirePermissions(PERMISSIONS.THEME_PUBLISH)
  async publishPreset(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishPreset(id, user.id));
  }

  @Post('presets/:id/reset')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async resetPreset(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.resetToDefaults(id, user.id));
  }

  @Delete('presets/:id')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async deletePreset(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deletePreset(id, user.id));
  }

  @Get('assets')
  @RequirePermissions(PERMISSIONS.THEME_VIEW)
  async listAssets(
    @Query(new ZodValidationPipe(z.object({ themeId: z.string().uuid().optional() })))
    query: { themeId?: string },
  ) {
    return ok(await this.service.listAssets(query.themeId));
  }

  @Post('assets')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async upsertAsset(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(upsertThemeAssetSchema)) body: UpsertThemeAssetInput,
  ) {
    return ok(await this.service.upsertAsset(body, user.id));
  }

  @Delete('assets/:id')
  @RequirePermissions(PERMISSIONS.THEME_EDIT)
  async deleteAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteAsset(id, user.id));
  }
}
