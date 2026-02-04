import { ApiProperty } from '@nestjs/swagger';

export class VideoUrlResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty({ required: false, nullable: true })
  expiresIn?: number;

  @ApiProperty({ required: false, nullable: true, format: 'date-time' })
  expiresAt?: string;

  @ApiProperty()
  isSigned!: boolean;
}
