import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderImagesDto {
  @ApiProperty({
    type: [String],
    description: 'Image IDs in their new display order',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  imageIds: string[];
}
