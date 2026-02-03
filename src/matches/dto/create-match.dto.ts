import { IsArray, IsDateString, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TrackingBallDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;
}

class TrackingTimelineEntryDto {
  @IsNumber()
  t!: number;

  @IsObject()
  @ValidateNested()
  @Type(() => TrackingBallDto)
  b!: TrackingBallDto;
}

class TrackingCourtDto {
  @IsNumber()
  width!: number;

  @IsNumber()
  height!: number;
}

export class CreateMatchDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  player1Name?: string;

  @IsOptional()
  @IsString()
  player2Name?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TrackingCourtDto)
  court?: TrackingCourtDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackingTimelineEntryDto)
  timeline?: TrackingTimelineEntryDto[];
}
