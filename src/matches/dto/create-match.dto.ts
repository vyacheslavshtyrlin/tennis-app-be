import { IsDateString, IsOptional, IsString } from 'class-validator';

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
}
