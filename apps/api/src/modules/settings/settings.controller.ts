import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  cmsDefaultsSettingsSchema,
  createThemeSchema,
  cursorPaginationQuerySchema,
  generalSettingsSchema,
  maintenanceSettingsSchema,
  securitySettingsSchema,
  seoDefaultsSettingsSchema,
  upsertFeatureFlagSchema,
  upsertSettingSchema,
  type CmsDefaultsSettingsInput,
  type CreateThemeInput,
  type CursorPaginationQuery,
  type GeneralSettingsInput,
  type MaintenanceSettingsInput,
  type SecuritySettingsInput,
  type SeoDefaultsSettingsInput,
  type UpsertFeatureFlagInput,
  type UpsertSettingInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async list(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listSettings(query));
  }

  @Put()
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async upsert(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(upsertSettingSchema)) body: UpsertSettingInput,
  ) {
    return ok(await this.service.upsertSetting(body, user.id));
  }

  @Get('general')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async general() {
    return ok(await this.service.getGeneral());
  }

  @Put('general')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateGeneral(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(generalSettingsSchema)) body: GeneralSettingsInput,
  ) {
    return ok(await this.service.setGeneral(body, user.id));
  }

  @Get('maintenance')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async maintenance() {
    return ok(await this.service.getMaintenance());
  }

  @Put('maintenance')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateMaintenance(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(maintenanceSettingsSchema)) body: MaintenanceSettingsInput,
  ) {
    return ok(await this.service.setMaintenance(body, user.id));
  }

  @Public()
  @Get('maintenance/status')
  async maintenanceStatus() {
    return ok(await this.service.getMaintenanceStatus());
  }

  @Get('security')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async security() {
    return ok(await this.service.getSecurity());
  }

  @Put('security')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateSecurity(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(securitySettingsSchema)) body: SecuritySettingsInput,
  ) {
    return ok(await this.service.setSecurity(body, user.id));
  }

  @Get('cms')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async cmsDefaults() {
    return ok(await this.service.getCmsDefaults());
  }

  @Put('cms')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateCmsDefaults(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(cmsDefaultsSettingsSchema)) body: CmsDefaultsSettingsInput,
  ) {
    return ok(await this.service.setCmsDefaults(body, user.id));
  }

  @Get('seo-defaults')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async seoDefaults() {
    return ok(await this.service.getSeoDefaults());
  }

  @Put('seo-defaults')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateSeoDefaults(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(seoDefaultsSettingsSchema)) body: SeoDefaultsSettingsInput,
  ) {
    return ok(await this.service.setSeoDefaults(body, user.id));
  }

  @Public()
  @Get('feature-flags/:key/enabled')
  async featureFlagEnabled(@Param('key') key: string) {
    return ok({ key, enabled: await this.service.isFeatureEnabled(key) });
  }

  @Public()
  @Get('themes/default')
  async defaultTheme() {
    return ok(await this.service.defaultTheme());
  }

  @Get('themes')
  @RequirePermissions(PERMISSIONS.THEME_MANAGE)
  async themes(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listThemes(query));
  }

  @Post('themes')
  @RequirePermissions(PERMISSIONS.THEME_MANAGE)
  async createTheme(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createThemeSchema)) body: CreateThemeInput,
  ) {
    return ok(await this.service.createTheme(body, user.id));
  }

  @Get('feature-flags')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async flags(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listFlags(query));
  }

  @Put('feature-flags')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async upsertFlag(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(upsertFeatureFlagSchema)) body: UpsertFeatureFlagInput,
  ) {
    return ok(await this.service.upsertFlag(body, user.id));
  }
}
