import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStoreSettingsAppearanceDto {
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
}
