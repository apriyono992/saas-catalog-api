import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetAdminStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
