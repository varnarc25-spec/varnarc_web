import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { getOpenSearchConfig, OpenSearchClient, OPENSEARCH_CLIENT } from './opensearch.client';

@Injectable()
export class OpenSearchBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(OpenSearchBootstrapService.name);

  constructor(
    @Optional() @Inject(OPENSEARCH_CLIENT) private readonly client?: OpenSearchClient,
  ) {}

  async onModuleInit() {
    if (!getOpenSearchConfig() || !this.client) return;

    try {
      await this.client.ensureIndex();
      const ok = await this.client.ping();
      if (ok) {
        this.logger.log('OpenSearch index ready');
      } else {
        this.logger.warn('OpenSearch ping failed after ensureIndex');
      }
    } catch (err) {
      this.logger.warn(
        `OpenSearch bootstrap skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
