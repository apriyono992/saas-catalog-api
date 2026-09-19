import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePlatformStoreSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialInstagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialFacebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  socialTiktok?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  socialWhatsapp?: string;

  @ApiPropertyOptional({ example: '#2d3336' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  navbarColor?: string;

  @ApiPropertyOptional({ example: '#2563eb' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  buttonColor?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  buttonTextColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'Kategori' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoryTitle?: string;

  @ApiPropertyOptional({ example: '#ffffff' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cardColor?: string;

  @ApiPropertyOptional({ example: '#fbf8f5' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cardSectionColor?: string;

  @ApiPropertyOptional({ example: '35' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  defaultStrikePercentage?: string;

  @ApiPropertyOptional({ example: 'local', enum: ['local', 's3'] })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  storageDriver?: string;

  @ApiPropertyOptional({ example: 'https://<account_id>.r2.cloudflarestorage.com' })
  @IsOptional()
  @IsString()
  s3Endpoint?: string;

  @ApiPropertyOptional({ example: 'auto' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  s3Region?: string;

  @ApiPropertyOptional({ example: 'catalog' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  s3Bucket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3AccessKeyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3SecretAccessKey?: string;

  @ApiPropertyOptional({ example: 'https://pub-xxxxxx.r2.dev' })
  @IsOptional()
  @IsString()
  s3PublicUrlBase?: string;
}
