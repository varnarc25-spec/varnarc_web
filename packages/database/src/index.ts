import { PrismaClient } from '@prisma/client';
import { createRepositories, type Repositories } from './repositories';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  repos?: Repositories;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

export const repos = globalForPrisma.repos ?? createRepositories(prisma);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.repos = repos;
}

export { PrismaClient, createRepositories };
export type { Repositories };
export * from '@prisma/client';
export * from './pagination';
export * from './repositories';
export {
  defaultBackupFilename,
  dumpConnectionUrl,
  isPgDumpAvailable,
  neonPoolerToDirect,
  openDatabaseDump,
  spawnPgDump,
  summarizeDumpConnection,
  writePgDumpFile,
} from './pg-backup';
export type { DumpConnectionSummary, PgDumpHandle } from './pg-backup';
export { sqlLiteral, sortTablesByForeignKeys } from './pg-logical-dump';
