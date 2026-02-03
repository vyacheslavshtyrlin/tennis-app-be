import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus, Prisma } from '@prisma/client';
import { Response } from 'express';

import { RedisService, WorkerJobPayload } from '../cache/redis.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TrackingData, TrackingTimelineEntry } from '../common/types/tracking';

import { WorkerCompleteDto } from './dto/complete-worker.dto';

@Injectable()
export class WorkerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly redisService: RedisService,
  ) {}

  async streamOriginalVideo(id: number, res: Response) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    this.storage.streamFile(match.originalVideoUrl, res);
  }

  async complete(dto: WorkerCompleteDto) {
    if (dto.status === MatchStatus.ERROR && !dto.errorMessage) {
      throw new BadRequestException('errorMessage is required when status is ERROR');
    }

    if (dto.status === MatchStatus.DONE) {
      this.assertValidTracking(dto.tracking);
    }

    const match = (await this.prisma.match.findUnique({ where: { id: dto.matchId } })) as any;
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    let trackingJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined;
    if (dto.status === MatchStatus.DONE) {
      trackingJson = dto.tracking as unknown as Prisma.InputJsonValue;
    } else if (match.tracking === null || match.tracking === undefined) {
      trackingJson = Prisma.JsonNull;
    } else {
      trackingJson = match.tracking as Prisma.InputJsonValue;
    }

    return this.prisma.match.update({
      where: { id: dto.matchId },
      data: {
        status: dto.status,
        tracking: trackingJson,
        description:
          dto.status === MatchStatus.ERROR && dto.errorMessage
            ? `${match.description || ''}\nERROR: ${dto.errorMessage}`.trim()
            : match.description,
      },
    });
  }

  async getNextJob(): Promise<WorkerJobPayload | null> {
    return this.redisService.popNextJob();
  }

  private assertValidTracking(tracking?: TrackingData) {
    if (!tracking || typeof tracking !== 'object') {
      throw new BadRequestException('tracking is required for DONE status');
    }
    const court = tracking.court;
    const timeline = tracking.timeline;
    if (!court || typeof court.width !== 'number' || typeof court.height !== 'number') {
      throw new BadRequestException('tracking.court.width/height are required numbers');
    }
    if (!Array.isArray(timeline)) {
      throw new BadRequestException('tracking.timeline must be an array');
    }
    for (const item of timeline as TrackingTimelineEntry[]) {
      if (!item || typeof item.t !== 'number') {
        throw new BadRequestException('tracking.timeline items require numeric t');
      }
      const b = item.b;
      if (!b || typeof b.x !== 'number' || typeof b.y !== 'number') {
        throw new BadRequestException('tracking.timeline items require b.x and b.y numbers');
      }
    }
  }
}
