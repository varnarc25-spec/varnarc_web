import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  bulkSeoRedirectImportSchema,
  createSeoRedirectSchema,
  seoAuditListQuerySchema,
  seoIntegrationsSchema,
  seoListQuerySchema,
  seoMetadataUpdateSchema,
  seoRedirectListQuerySchema,
  seoRobotsSettingsSchema,
  updateSeoRedirectSchema,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly service: SeoService) {}

  @Get('status')
  @Public()
  async status() {
    return ok({ module: 'seo', status: 'ready' });
  }

  // --- Metadata ---

  @Get('meta')
  @RequirePermissions(PERMISSIONS.SEO_VIEW)
  async listMetadata(@Query(new ZodValidationPipe(seoListQuerySchema)) query: unknown) {
    const parsed = seoListQuerySchema.parse(query);
    const result = await this.service.listMetadata(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Public()
  @Get('meta/:entityType/:entityId')
  async getMetadata(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const row = await this.service.getMetadataOptional(entityType, entityId);
    return ok(row);
  }

  @Put('meta/:entityType/:entityId')
  @RequirePermissions(PERMISSIONS.SEO_EDIT)
  async upsertMetadata(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body(new ZodValidationPipe(seoMetadataUpdateSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(
      await this.service.upsertMetadata(
        entityType,
        entityId,
        seoMetadataUpdateSchema.parse(body),
        user?.id,
      ),
    );
  }

  // --- Redirects ---

  @Get('redirects')
  @RequirePermissions(PERMISSIONS.SEO_REDIRECTS)
  async listRedirects(@Query(new ZodValidationPipe(seoRedirectListQuerySchema)) query: unknown) {
    const parsed = seoRedirectListQuerySchema.parse(query);
    const result = await this.service.listRedirects(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 25,
    });
  }

  @Get('redirects/export')
  @RequirePermissions(PERMISSIONS.SEO_REDIRECTS)
  async exportRedirects() {
    return ok(await this.service.exportRedirects());
  }

  @Public()
  @Get('redirects/resolve')
  async resolveRedirect(@Query('path') path: string) {
    if (!path) return ok(null);
    return ok(await this.service.resolveRedirect(path));
  }

  @Public()
  @Get('redirects/active')
  async listActiveRedirects() {
    return ok(await this.service.listActiveRedirects());
  }

  @Post('redirects')
  @RequirePermissions(PERMISSIONS.SEO_REDIRECTS)
  async createRedirect(
    @Body(new ZodValidationPipe(createSeoRedirectSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.createRedirect(createSeoRedirectSchema.parse(body), user?.id));
  }

  @Post('redirects/import')
  @RequirePermissions(PERMISSIONS.SEO_REDIRECTS)
  async importRedirects(
    @Body(new ZodValidationPipe(bulkSeoRedirectImportSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.importRedirects(bulkSeoRedirectImportSchema.parse(body), user?.id));
  }

  @Put('redirects/:id')
  @RequirePermissions(PERMISSIONS.SEO_REDIRECTS)
  async updateRedirect(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSeoRedirectSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.updateRedirect(id, updateSeoRedirectSchema.parse(body), user?.id));
  }

  @Delete('redirects/:id')
  @RequirePermissions(PERMISSIONS.SEO_REDIRECTS)
  async deleteRedirect(@Param('id') id: string, @CurrentUserDecorator() user?: CurrentUser) {
    return ok(await this.service.deleteRedirect(id, user?.id));
  }

  // --- Sitemaps ---

  @Get('sitemaps/status')
  @RequirePermissions(PERMISSIONS.SEO_VIEW)
  async sitemapStatus() {
    return ok(await this.service.sitemapStatus());
  }

  @Post('sitemaps/rebuild')
  @RequirePermissions(PERMISSIONS.SEO_EDIT)
  async rebuildSitemaps(@CurrentUserDecorator() user?: CurrentUser) {
    return ok(await this.service.rebuildSitemaps());
  }

  @Public()
  @Get('sitemap')
  @Header('Content-Type', 'application/xml')
  async sitemapIndex() {
    return this.service.sitemapIndexXml();
  }

  @Public()
  @Get('sitemap/:type')
  @Header('Content-Type', 'application/xml')
  async sitemapType(@Param('type') type: string) {
    const normalized = type.replace(/\.xml$/i, '');
    return this.service.sitemapTypeXml(normalized);
  }

  // --- Robots ---

  @Get('robots/settings')
  @RequirePermissions(PERMISSIONS.SEO_VIEW)
  async getRobotsSettings() {
    return ok(await this.service.getRobotsSettings());
  }

  @Put('robots/settings')
  @RequirePermissions(PERMISSIONS.SEO_EDIT)
  async setRobotsSettings(
    @Body(new ZodValidationPipe(seoRobotsSettingsSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.setRobotsSettings(seoRobotsSettingsSchema.parse(body), user?.id));
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  async robotsTxt() {
    return this.service.robotsTxt();
  }

  // --- Audit ---

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.SEO_VIEW)
  async dashboard() {
    return ok(await this.service.dashboard());
  }

  @Get('audit')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  async listAudit(@Query(new ZodValidationPipe(seoAuditListQuerySchema)) query: unknown) {
    const parsed = seoAuditListQuerySchema.parse(query);
    const result = await this.service.listAuditIssues(parsed);
    return okCursor({
      items: result.items,
      nextCursor: result.nextCursor,
      prevCursor: null,
      hasMore: result.hasMore,
      limit: parsed.limit ?? 50,
    });
  }

  @Post('audit/run')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  async runAudit(@CurrentUserDecorator() user?: CurrentUser) {
    return ok(await this.service.runAudit(user?.id));
  }

  @Post('audit/:id/resolve')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  async resolveAudit(@Param('id') id: string, @CurrentUserDecorator() user?: CurrentUser) {
    return ok(await this.service.resolveAuditIssue(id, user?.id));
  }

  // --- Analytics & integrations ---

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.SEO_VIEW)
  async analytics() {
    return ok(await this.service.analytics());
  }

  @Get('integrations')
  @RequirePermissions(PERMISSIONS.SEO_EDIT)
  async getIntegrations() {
    return ok(await this.service.getIntegrations());
  }

  @Put('integrations')
  @RequirePermissions(PERMISSIONS.SEO_EDIT)
  async setIntegrations(
    @Body(new ZodValidationPipe(seoIntegrationsSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.setIntegrations(seoIntegrationsSchema.parse(body), user?.id));
  }
}
