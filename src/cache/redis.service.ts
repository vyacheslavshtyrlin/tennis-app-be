import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type WorkerJobPayload = {
  type: string;
  matchId: number;
  createdAt?: number;
  [key: string]: unknown;
};

const JOBS_QUEUE = 'jobs_queue';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    const url = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(url);
  }

  async enqueueTranscodeAndAnalyze(matchId: number) {
    const payload: WorkerJobPayload = {
      type: 'TRANSCODE_AND_ANALYZE',
      matchId,
      createdAt: Math.floor(Date.now() / 1000),
    };
    await this.client.rpush(JOBS_QUEUE, JSON.stringify(payload));
  }

  async popNextJob(timeoutSeconds = 20): Promise<WorkerJobPayload | null> {
    const result = await this.client.blpop(JOBS_QUEUE, timeoutSeconds);
    if (!result) {
      return null;
    }
    const [, raw] = result;
    try {
      return JSON.parse(raw) as WorkerJobPayload;
    } catch {
      return null;
    }
  }

  getClient() {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
