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
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../common/decorators/user.decorator';

import { CreateMatchDto } from './dto/create-match.dto';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  list(@CurrentUser() user: { userId: number }) {
    return this.matchesService.listMatches(user.userId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: { userId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.matchesService.getMatch(user.userId, id);
  }

  @ApiConsumes('multipart/form-data')
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
