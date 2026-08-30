import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConstructionController } from './construction.controller';
import { ConstructionService } from './construction.service';
import { CommunityPriceReportsService } from './community-price-reports.service';
import { PriceAlertsSchedulerService } from './price-alerts.scheduler';
import { PriceAlertsService } from './price-alerts.service';
import { ConstructionSeoAuditController } from './construction-seo-audit.controller';
import { ConstructionSeoAuditSchedulerService } from './construction-seo-audit.scheduler';
import { ConstructionSeoAuditService } from './construction-seo-audit.service';
import { ConstructionSearchOpportunityController } from './construction-search-opportunity.controller';
import { ConstructionSearchOpportunitySchedulerService } from './construction-search-opportunity.scheduler';
import { ConstructionSearchOpportunityService } from './construction-search-opportunity.service';

@Module({
  imports: [MediaModule, NotificationsModule],
  controllers: [
    ConstructionController,
    ConstructionSeoAuditController,
    ConstructionSearchOpportunityController,
  ],
  providers: [
    ConstructionService,
    PriceAlertsService,
    PriceAlertsSchedulerService,
    CommunityPriceReportsService,
    ConstructionSeoAuditService,
    ConstructionSeoAuditSchedulerService,
    ConstructionSearchOpportunityService,
    ConstructionSearchOpportunitySchedulerService,
  ],
  exports: [ConstructionService, PriceAlertsService, CommunityPriceReportsService],
})
export class ConstructionModule {}
