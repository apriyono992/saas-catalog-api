import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { AppConfig } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { StorageModule } from './shared/storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './shared/auth/auth.module';
import { UsersModule } from './shared/users/users.module';
import { AdminModule } from './module/admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        pinoHttp: {
          level:
            configService.get('app.nodeEnv', { infer: true }) === 'production'
              ? 'info'
              : 'debug',
        },
      }),
    }),
    DatabaseModule,
    CommonModule,
    StorageModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AdminModule,
  ],
})
export class AppModule {}
