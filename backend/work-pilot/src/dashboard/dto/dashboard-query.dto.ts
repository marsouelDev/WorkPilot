import { IsIn, IsOptional, IsString } from 'class-validator';

export const VALID_RANGES = ['7d', '30d', '90d', '6m', '1y', 'all'] as const;
export type TimeRange = (typeof VALID_RANGES)[number];

export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(VALID_RANGES)
  range?: TimeRange = '30d';
}
