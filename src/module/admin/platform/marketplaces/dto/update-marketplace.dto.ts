import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMarketplaceDto {
  @ApiPropertyOptional({ example: 'Tokopedia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'tokopedia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;
}
