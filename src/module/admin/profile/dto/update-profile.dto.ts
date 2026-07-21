import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}
