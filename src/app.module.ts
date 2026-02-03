import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CommonModule } from './common/common.module';
import { MatchesModule } from './matches/matches.module';
import { StorageModule } from './storage/storage.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : '.env.example',
    }),
    CommonModule,
    CacheModule,
    StorageModule,
    AuthModule,
    MatchesModule,
    WorkerModule,
  ],
})
export class AppModule {}
