import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@varnarc/database';
import {
  CATALOG_ENTITIES,
  type CatalogImportQuery,
  type CatalogReindexInput,
  type CatalogVertical,
  type SearchReindexInput,
} from '@varnarc/validation';
import { PRISMA } from '../../database/database.module';
import { AutomobileService } from '../automobile/automobile.service';
import { ConstructionService } from '../construction/construction.service';
import { FinanceGapService } from '../finance/finance-gap.service';
import { SearchService } from '../search/search.service';
import { countCsvDataRows, splitCsvIntoBatches } from './csv-batch.util';

const VERTICAL_SEARCH_MODULES: Record<CatalogVertical, SearchReindexInput['module']> = {
  finance: 'finance',
  construction: 'construction',
  automobile: 'automobile',
};

@Injectable()
export class CatalogOpsService {
  constructor(
    @Inject(PRISMA) private readonly db: PrismaClient,
    private readonly financeGap: FinanceGapService,
    private readonly construction: ConstructionService,
    private readonly automobile: AutomobileService,
    private readonly search: SearchService,
  ) {}

  overview() {
    return {
      verticals: CATALOG_ENTITIES,
      batchDefaults: {
        batchSize: Number(process.env.CATALOG_IMPORT_BATCH_SIZE ?? 500),
        maxFileMb: Number(process.env.CATALOG_IMPORT_MAX_MB ?? 50),
      },
      cli: 'pnpm catalog:import -- --vertical finance --entity loans --file ./data/loans.csv',
    };
  }

  async counts() {
    const where = { deletedAt: null };
    const [banks, loans, creditCards, insurance, investments, materials, brands, manufacturers, vehicles] =
      await Promise.all([
        this.db.bank.count({ where }),
        this.db.loan.count({ where }),
        this.db.creditCard.count({ where }),
        this.db.insuranceProduct.count({ where }),
        this.db.investmentProduct.count({ where }),
        this.db.constructionMaterial.count({ where }),
        this.db.constructionBrand.count({ where }),
        this.db.automobileManufacturer.count({ where }),
        this.db.automobileVehicle.count({ where }),
      ]);

    return {
      finance: { banks, loans, creditCards, insurance, investments },
      construction: { brands, materials },
      automobile: { manufacturers, vehicles },
      total:
        banks + loans + creditCards + insurance + investments + materials + brands + manufacturers + vehicles,
    };
  }

  async importBatched(query: CatalogImportQuery, csvText: string, actorId: string) {
    this.assertEntity(query.vertical, query.entity);

    const totalRows = countCsvDataRows(csvText);
    const batches = splitCsvIntoBatches(csvText, query.batchSize);
    if (!batches.length) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'CSV has no data rows.' },
      });
    }

    const started = Date.now();
    let imported = 0;
    const batchResults: Array<{ batch: number; imported: number }> = [];

    for (let i = 0; i < batches.length; i += 1) {
      const result = await this.importChunk(query.vertical, query.entity, batches[i]!, actorId);
      imported += result.imported;
      batchResults.push({ batch: i + 1, imported: result.imported });
    }

    let reindex: Record<string, unknown> | null = null;
    if (query.reindex !== false) {
      const mod = VERTICAL_SEARCH_MODULES[query.vertical];
      reindex = (await this.search.reindex({ module: mod, async: false }, actorId)) as Record<
        string,
        unknown
      >;
    }

    return {
      vertical: query.vertical,
      entity: query.entity,
      totalRows,
      batches: batches.length,
      imported,
      batchSize: query.batchSize,
      durationMs: Date.now() - started,
      batchResults,
      reindex,
    };
  }

  async reindexCatalog(input: CatalogReindexInput, actorId: string) {
    const modules = input.modules ?? ['finance', 'construction', 'automobile'];
    const results = [];
    for (const mod of modules) {
      results.push({
        module: mod,
        ...(await this.search.reindex(
          { module: mod as SearchReindexInput['module'], async: false },
          actorId,
        )),
      });
    }
    return { modules: results };
  }

  private assertEntity(vertical: CatalogVertical, entity: string) {
    const allowed = CATALOG_ENTITIES[vertical];
    if (!allowed.includes(entity)) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Unknown entity "${entity}" for ${vertical}. Allowed: ${allowed.join(', ')}`,
        },
      });
    }
  }

  private importChunk(vertical: CatalogVertical, entity: string, csvChunk: string, actorId: string) {
    if (vertical === 'finance') {
      return this.financeGap.importCsv(entity, csvChunk, actorId);
    }
    if (vertical === 'construction') {
      return this.construction.importCsv(entity, csvChunk, actorId);
    }
    return this.automobile.importCsv(entity, csvChunk, actorId);
  }
}
