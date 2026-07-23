import { Global, Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService, SecurityConfigService } from './security.service';
import { SecurityEventsService } from './security-events.service';
import { Auth0ManagementService } from './auth0-management.service';

@Global()
@Module({
  controllers: [SecurityController],
  providers: [
    SecurityEventsService,
    SecurityConfigService,
    SecurityService,
    Auth0ManagementService,
  ],
  exports: [SecurityEventsService, SecurityConfigService, SecurityService, Auth0ManagementService],
})
export class SecurityModule {}
