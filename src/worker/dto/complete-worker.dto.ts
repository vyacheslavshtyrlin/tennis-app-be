import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MatchStatus } from '@prisma/client';

import { TrackingData } from '../../common/types/tracking';

export class WorkerCompleteDto {
  @IsNumber()
  matchId!: number;

  @IsEnum(MatchStatus)
  status!: MatchStatus;

  @IsOptional()
  tracking?: TrackingData;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
