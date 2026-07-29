import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVariantTypeDto {
  @ApiProperty({ example: 'Ukuran' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
