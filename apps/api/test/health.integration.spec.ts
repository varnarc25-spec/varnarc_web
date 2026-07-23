import 'reflect-metadata';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthModule } from '../src/health/health.module';
import { PRISMA } from '../src/database/database.module';

describe('Health API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(PRISMA)
      .useValue({
        $queryRaw: async () => 1,
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        if (!res.body.data?.service) throw new Error('missing service');
      });
  });

  it('GET /api/v1/ready returns 200 when dependencies ok', async () => {
    process.env.DATABASE_URL = 'postgresql://test';
    delete process.env.REDIS_URL;

    await request(app.getHttpServer()).get('/api/v1/ready').expect(200);
  });
});
