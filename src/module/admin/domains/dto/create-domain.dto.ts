import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateDomainDto {
  @ApiProperty({ example: 'tokosaya.com' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,
    {
      message: 'hostname must be a valid domain name',
    },
  )
  hostname: string;
}
