import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { StorageModule } from '../storage/storage.module';

import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Module({
  imports: [StorageModule, CacheModule],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
