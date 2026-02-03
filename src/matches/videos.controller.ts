import { Controller, Get, Param, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../common/decorators/user.decorator';

import { MatchesService } from './matches.service';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('videos')
export class VideosController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get(':id')
  stream(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.matchesService.streamOriginalVideo(user.userId, id, res);
  }

  @Get(':id/url')
  getSignedUrl(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.matchesService.getVideoDownloadUrl(user.userId, id);
  }
}
