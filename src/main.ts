import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { LOCAL_STORAGE_URL_PREFIX } from './shared/storage/local-storage.provider';
import { DomainsRepository } from './shared/domains/domains.repository';

const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const configService = app.get(ConfigService<AppConfig, true>);

  await app.register(multipart, {
    limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
  });

  // CSP off: this is a JSON API, and Swagger UI's inline scripts/styles
  // conflict with Helmet's default policy. The other headers still apply.
  await app.register(helmet, { contentSecurityPolicy: false });

  if (configService.get('storage.driver', { infer: true }) === 'local') {
    app.useStaticAssets({
      root: resolve(configService.get('storage.uploadDir', { infer: true })),
      prefix: `${LOCAL_STORAGE_URL_PREFIX}/`,
    });
  }

  const domainsRepository = app.get(DomainsRepository);
  const cmsAppDomain = configService
    .get('app.cmsAppDomain', { infer: true })
    .toLowerCase();

  app.enableCors({
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'],
    origin: (origin, callback) => {
      // No Origin header means a non-browser request (server-to-server,
      // curl, mobile apps) — CORS is a browser-only mechanism, nothing to check.
      if (!origin) {
        callback(null, true);
        return;
      }

      let originHost: string;
      try {
        originHost = new URL(origin).hostname.toLowerCase();
      } catch {
        callback(null, false);
        return;
      }

      if (originHost === cmsAppDomain) {
        callback(null, true);
        return;
      }

      domainsRepository
        .findByHostname(originHost)
        .then((domain) => callback(null, !!domain))
        .catch(() => callback(null, false));
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS Catalog API')
    .setDescription('Multi-tenant SaaS catalog backend API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get('app.port', { infer: true });
  await app.listen(port, '0.0.0.0');
}
void bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
