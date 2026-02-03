import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { Response } from 'express';

import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TrackingData } from '../common/types/tracking';

import { CreateMatchDto } from './dto/create-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {}

  async listMatches(userId: number) {
    const matches = await this.prisma.match.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return matches.map((m: any) => {
      const { tracking, ...rest } = m;
      return rest;
    });
  }

  async getMatch(userId: number, id: number) {
    const match = (await this.prisma.match.findFirst({
      where: { id, userId },
    })) as any;
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    const trackingValue =
      (match.tracking as TrackingData | null) ?? (match.trackingJson as TrackingData | null) ?? [];
    return {
      ...match,
      tracking: trackingValue,
    };
  }

  async createMatch(userId: number, dto: CreateMatchDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    const originalVideoUrl = await this.storageService.saveUploadedFile(file);
    const match = await this.prisma.match.create({
      data: {
        userId,
        title: dto.title,
        player1Name: dto.player1Name,
        player2Name: dto.player2Name,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        location: dto.location,
        description: dto.description,
        originalVideoUrl,
        status: MatchStatus.UPLOADED,
      },
    });

    await this.redisService.enqueueTranscodeAndAnalyze(match.id);
    return match;
  }

  async streamOriginalVideo(userId: number, id: number, res: Response) {
    const match = await this.getMatch(userId, id);
    this.storageService.streamFile(match.originalVideoUrl, res);
  }

  async getVideoDownloadUrl(userId: number, id: number) {
    const match = await this.getMatch(userId, id);

    if (this.storageService.isS3()) {
      const expiresIn = this.storageService.getSignedUrlExpiresSeconds();
      const url = this.storageService.getSignedDownloadUrl(match.originalVideoUrl, expiresIn);
      return {
        url,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        isSigned: true,
      };
    }

    return {
      url: this.storageService.buildApiUrl(`v1/videos/${id}`),
      isSigned: false,
    };
  }
}
