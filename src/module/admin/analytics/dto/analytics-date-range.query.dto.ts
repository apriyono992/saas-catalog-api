import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class AnalyticsDateRangeQueryDto {
  @ApiPropertyOptional({ description: 'ISO 8601 date, inclusive' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date, inclusive' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
