import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateMarketplaceLinkDto {
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
