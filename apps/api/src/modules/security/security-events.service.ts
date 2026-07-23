import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type { SecurityEventSeverity } from '@varnarc/database';
import { REPOS } from '../../database/database.module';

export type RecordSecurityEventInput = {
  eventType: string;
  severity?: SecurityEventSeverity;
  description: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

/** Fire-and-forget security event persistence. */
@Injectable()
export class SecurityEventsService {
  private readonly logger = new Logger(SecurityEventsService.name);

  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  record(input: RecordSecurityEventInput): void {
    void this.repos.securityEvents
      .create({
        eventType: input.eventType,
        severity: input.severity,
        description: input.description,
        userId: input.userId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata as never,
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to record security event ${input.eventType}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }
}
