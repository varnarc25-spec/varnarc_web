import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { API_PREFIX } from '@varnarc/config';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { validateStartupEnv } from './config/startup-env';
import { initOpenTelemetry } from './observability/otel';

for (const candidate of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../.env'),
]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
}

async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log('[startup] Booting Varnarc API…');
  await initOpenTelemetry();
  validateStartupEnv();
  // eslint-disable-next-line no-console
  console.log('[startup] Environment validation passed');

  const app = await NestFactory.create(AppModule);
  // eslint-disable-next-line no-console
  console.log('[startup] Nest application created');

  const { SecurityConfigService } = await import('./modules/security/security.service');
  const securityConfig = app.get(SecurityConfigService);

  app.use(requestIdMiddleware);
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));
  app.enableCors({
    origin: securityConfig.getCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Varnarc API')
    .setDescription('Varnarc Platform REST API (v1)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Varnarc API listening on http://0.0.0.0:${port}${API_PREFIX}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs at http://0.0.0.0:${port}/api/v1/docs`);
}

void bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[startup] Fatal error:', err);
  process.exit(1);
});
