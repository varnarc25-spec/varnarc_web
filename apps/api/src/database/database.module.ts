import { Global, Module } from '@nestjs/common';
import { prisma, repos, type PrismaClient, type Repositories } from '@varnarc/database';

export const PRISMA = Symbol('PRISMA');
export const REPOS = Symbol('REPOS');

@Global()
@Module({
  providers: [
    { provide: PRISMA, useValue: prisma },
    { provide: REPOS, useValue: repos },
  ],
  exports: [PRISMA, REPOS],
})
export class DatabaseModule {}

export type { PrismaClient, Repositories };
