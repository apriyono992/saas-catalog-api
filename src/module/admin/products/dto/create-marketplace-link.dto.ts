import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

export class CreateMarketplaceLinkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  marketplaceId?: string;

  @ApiProperty({ example: 'Tokopedia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  marketplaceName: string;

  @ApiProperty()
  @IsUrl()
  @MaxLength(500)
  url: string;
}
