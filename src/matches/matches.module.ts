import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { CacheModule } from '../cache/cache.module';
import { StorageModule } from '../storage/storage.module';

import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { VideosController } from './videos.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), StorageModule, CacheModule],
  controllers: [MatchesController, VideosController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
