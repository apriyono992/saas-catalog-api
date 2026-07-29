import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum StorageDriver {
  Local = 'local',
  S3 = 's3',
}

class EnvironmentVariables {
  @IsIn([NodeEnv.Development, NodeEnv.Production, NodeEnv.Test])
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  CMS_APP_DOMAIN: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TTL: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_TTL: string;

  @IsIn([StorageDriver.Local, StorageDriver.S3])
  @IsOptional()
  STORAGE_DRIVER: StorageDriver = StorageDriver.Local;

  @IsString()
  @IsNotEmpty()
  UPLOAD_DIR: string;

  // Only required at runtime when STORAGE_DRIVER=s3 — kept optional here so
  // `local` (the default) doesn't force every deployment to configure S3.
  @IsString()
  @IsOptional()
  S3_BUCKET?: string;

  @IsString()
  @IsOptional()
  S3_REGION?: string;

  @IsString()
  @IsOptional()
  S3_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  S3_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  S3_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  S3_PUBLIC_URL_BASE?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const message = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation error: ${message}`);
  }

  return validatedConfig;
}
