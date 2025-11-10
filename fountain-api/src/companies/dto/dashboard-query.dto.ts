import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: ['REQUIRE_DEPOSIT', 'completed', 'pending'] })
  status?: string;

  @ApiPropertyOptional({ enum: ['mint', 'burn'] })
  type?: 'mint' | 'burn';

  @ApiPropertyOptional({ description: 'ISO date start filter', example: '2025-01-01T00:00:00Z' })
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date end filter', example: '2025-01-31T23:59:59Z' })
  to?: string;

  @ApiPropertyOptional({ example: 10 })
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  offset?: number;
}

export class SummaryQueryDto {
  @ApiPropertyOptional({ description: 'ISO date start filter', example: '2025-01-01T00:00:00Z' })
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date end filter', example: '2025-01-31T23:59:59Z' })
  to?: string;
}