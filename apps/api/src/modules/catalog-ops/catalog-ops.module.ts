import { Module } from '@nestjs/common';
import { AutomobileModule } from '../automobile/automobile.module';
import { ConstructionModule } from '../construction/construction.module';
import { FinanceModule } from '../finance/finance.module';
import { SearchModule } from '../search/search.module';
import { CatalogOpsController } from './catalog-ops.controller';
import { CatalogOpsService } from './catalog-ops.service';

@Module({
  imports: [FinanceModule, ConstructionModule, AutomobileModule, SearchModule],
  controllers: [CatalogOpsController],
  providers: [CatalogOpsService],
  exports: [CatalogOpsService],
})
export class CatalogOpsModule {}
