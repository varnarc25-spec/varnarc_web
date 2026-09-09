import { Injectable, ServiceUnavailableException, StreamableFile } from '@nestjs/common';
import {
  dumpConnectionUrl,
  isPgDumpAvailable,
  spawnPgDump,
  summarizeDumpConnection,
} from '@varnarc/database';

@Injectable()
export class DatabaseBackupService {
  async status() {
    const url = dumpConnectionUrl();
    return {
      ...summarizeDumpConnection(url),
      dumpTool: 'pg_dump' as const,
      pgDumpAvailable: await isPgDumpAvailable(),
    };
  }

  async createDump(): Promise<StreamableFile> {
    const url = dumpConnectionUrl();
    if (!url) {
      throw new ServiceUnavailableException('DATABASE_URL is not configured');
    }
    if (!(await isPgDumpAvailable())) {
      throw new ServiceUnavailableException(
        'pg_dump is not installed on the API host. Run `pnpm db:backup` on a machine with PostgreSQL client tools.',
      );
    }

    const { stdout, filename } = spawnPgDump(url);
    return new StreamableFile(stdout, {
      type: 'application/sql; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
