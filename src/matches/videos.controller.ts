import { Controller, Get, Param, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../common/decorators/user.decorator';

import { VideoUrlResponseDto } from './dto/video-url.dto';
import { MatchesService } from './matches.service';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('videos')
export class VideosController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  @ApiProduces('video/*')
  @ApiOkResponse({
    description: 'Streams the original video file.',
    schema: { type: 'string', format: 'binary' },
  })
  stream(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.matchesService.streamOriginalVideo(user.userId, id, res);
  }

  @Get(':id/url')
  @ApiOkResponse({ type: VideoUrlResponseDto })
  getSignedUrl(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.matchesService.getVideoDownloadUrl(user.userId, id);
  }
}
