import { Body, Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { WorkerCompleteDto } from './dto/complete-worker.dto';
import { WorkerService } from './worker.service';

@ApiTags('worker')
@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get('matches/:id/original-video')
  getOriginal(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.workerService.streamOriginalVideo(id, res);
  }

  @Get('jobs/next')
  async nextJob(@Res() res: Response) {
    const job = await this.workerService.getNextJob();
    if (!job) {
      return res.status(204).send();
    }
    return res.json(job);
  }

  @Post('complete')
  complete(@Body() dto: WorkerCompleteDto) {
    return this.workerService.complete(dto);
  }
}
