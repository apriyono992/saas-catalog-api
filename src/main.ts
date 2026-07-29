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
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { LOCAL_STORAGE_URL_PREFIX } from './shared/storage/local-storage.provider';

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

  if (configService.get('storage.driver', { infer: true }) === 'local') {
    app.useStaticAssets({
      root: resolve(configService.get('storage.uploadDir', { infer: true })),
      prefix: `${LOCAL_STORAGE_URL_PREFIX}/`,
    });
  }

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
void bootstrap();
