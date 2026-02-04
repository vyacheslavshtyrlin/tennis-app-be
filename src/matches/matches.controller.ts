import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../common/decorators/user.decorator';

import { CreateMatchDto } from './dto/create-match.dto';
import { MatchDetailDto, MatchListItemDto } from './dto/match.dto';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOkResponse({ type: MatchListItemDto, isArray: true })
  list(@CurrentUser() user: { userId: number }) {
    return this.matchesService.listMatches(user.userId);
  }

  @Get(':id')
  @ApiOkResponse({ type: MatchDetailDto })
  getOne(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.matchesService.getMatch(user.userId, id);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', nullable: true },
        player1Name: { type: 'string', nullable: true },
        player2Name: { type: 'string', nullable: true },
        eventDate: { type: 'string', format: 'date-time', nullable: true },
        location: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  create(
    @CurrentUser() user: { userId: number },
    @Body() dto: CreateMatchDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.matchesService.createMatch(user.userId, dto, file);
  }
}
