import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SECURITY_RATE_LIMITS } from '@varnarc/config';
import { buildCacheModule } from './cache/cache.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CmsModule } from './modules/cms/cms.module';
import { MediaModule } from './modules/media/media.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ThemeModule } from './modules/theme/theme.module';
import { HomepageModule } from './modules/homepage/homepage.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DirectoryModule } from './modules/directory/directory.module';
import { AiModule } from './modules/ai/ai.module';
import { AiToolsModule } from './modules/ai-tools/ai-tools.module';
import { SeoModule } from './modules/seo/seo.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ConstructionModule } from './modules/construction/construction.module';
import { AutomobileModule } from './modules/automobile/automobile.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PlatformApiModule } from './modules/platform-api/platform-api.module';
import { PremiumModule } from './modules/premium/premium.module';
import { CatalogOpsModule } from './modules/catalog-ops/catalog-ops.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { SecurityModule } from './modules/security/security.module';
import { CacheInvalidationModule } from './cache/cache-invalidation.module';
import { RedisThrottlerStorage } from './security/redis-throttler.storage';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { PrometheusInterceptor } from './common/interceptors/prometheus.interceptor';

const redisUrl = process.env.REDIS_URL?.trim();
const rateLimit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? SECURITY_RATE_LIMITS.global);

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: rateLimit }],
        ...(redisUrl ? { storage: new RedisThrottlerStorage(redisUrl) } : {}),
      }),
    }),
    buildCacheModule(),
    CacheInvalidationModule,
    SecurityModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CmsModule,
    MediaModule,
    AdvertisementsModule,
    CalculatorModule,
    SettingsModule,
    ThemeModule,
    HomepageModule,
    ReviewsModule,
    DirectoryModule,
    AiModule,
    AiToolsModule,
    SeoModule,
    AnalyticsModule,
    NewsletterModule,
    NotificationsModule,
    SearchModule,
    FinanceModule,
    ConstructionModule,
    AutomobileModule,
    ComparisonModule,
    DashboardModule,
    AuditModule,
    ReportsModule,
    PlatformApiModule,
    PremiumModule,
    CatalogOpsModule,
    PerformanceModule,
    MonitoringModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: PrometheusInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
