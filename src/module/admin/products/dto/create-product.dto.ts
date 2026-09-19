import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Auto-generated from name when omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ example: '75000.00' })
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'basePrice must be a valid decimal amount',
  })
  basePrice?: string;

  @ApiPropertyOptional({ example: '100000.00' })
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'strikePrice must be a valid decimal amount',
  })
  strikePrice?: string;
}
