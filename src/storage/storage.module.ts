import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

import { StorageService } from './storage.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const root = path.resolve(config.get<string>('STORAGE_ROOT') || 'uploads');
        const videoDir = path.join(root, 'videos');

        return {
          storage: diskStorage({
            destination: (req, file, cb) => {
              cb(null, videoDir);
            },
            filename: (req, file, cb) => {
              const timestamp = Date.now();
              const safeName = file.originalname.replace(/\s+/g, '-');
              cb(null, `${timestamp}-${safeName}`);
            },
          }),
          limits: {
            fileSize: 1024 * 1024 * 1024, // 1GB
          },
        };
      },
    }),
  ],
  providers: [StorageService],
  exports: [StorageService, MulterModule],
})
export class StorageModule {}
