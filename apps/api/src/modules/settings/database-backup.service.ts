import { Injectable, ServiceUnavailableException, StreamableFile } from '@nestjs/common';
import {
  dumpConnectionUrl,
  isPgDumpAvailable,
  openDatabaseDump,
  summarizeDumpConnection,
} from '@varnarc/database';

@Injectable()
export class DatabaseBackupService {
  async status() {
    const url = dumpConnectionUrl();
    const pgDumpAvailable = await isPgDumpAvailable();
    return {
      ...summarizeDumpConnection(url),
      dumpTool: pgDumpAvailable ? ('pg_dump' as const) : ('sql' as const),
      pgDumpAvailable,
    };
  }

  async createDump(): Promise<StreamableFile> {
    const url = dumpConnectionUrl();
    if (!url) {
      throw new ServiceUnavailableException('DATABASE_URL is not configured');
    }

    const { stdout, filename } = await openDatabaseDump(url);
    return new StreamableFile(stdout, {
      type: 'application/sql; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
