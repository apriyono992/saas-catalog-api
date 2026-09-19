import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMarketplaceDto {
  @ApiProperty({ example: 'Tokopedia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'tokopedia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;
}
