import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import * as path from 'path';
import EasyYandexS3 from 'easy-yandex-s3';

type StorageDriver = 'local' | 's3';

@Injectable()
export class StorageService {
  private readonly root: string;
  private readonly publicBaseUrl: string;
  private readonly driver: StorageDriver;
  private readonly s3?: EasyYandexS3;
  private readonly s3Prefix: string;
  private readonly s3Bucket?: string;
  private readonly signedUrlExpiresSeconds: number;

  constructor(configService: ConfigService) {
    this.root = path.resolve(configService.get<string>('STORAGE_ROOT') || 'uploads');
    this.publicBaseUrl = configService.get<string>('PUBLIC_BASE_URL') || 'http://localhost:3000';
    this.driver = (configService.get<string>('STORAGE_DRIVER') || 'local').toLowerCase() as StorageDriver;
    this.s3Prefix = configService.get<string>('S3_PREFIX') || '/videos/';
    this.signedUrlExpiresSeconds =
      Number(configService.get<string>('S3_SIGNED_URL_EXPIRES_SECONDS')) || 900;
    if (this.driver === 's3') {
      const accessKeyId = configService.get<string>('S3_ACCESS_KEY_ID');
      const secretAccessKey = configService.get<string>('S3_SECRET_ACCESS_KEY');
      const bucket = configService.get<string>('S3_BUCKET');
      const debug = configService.get<string>('S3_DEBUG') === 'true';

      if (!accessKeyId || !secretAccessKey || !bucket) {
        throw new Error('S3 config is required when STORAGE_DRIVER=s3');
      }
      this.s3Bucket = bucket;

      this.s3 = new EasyYandexS3({
        auth: {
          accessKeyId,
          secretAccessKey,
        },
        Bucket: bucket,
        debug,
      });
    }
    this.ensureDir(this.root);
    this.ensureDir(this.getVideoDir());
  }

  getRoot() {
    return this.root;
  }

  getVideoDir() {
    return path.join(this.root, 'videos');
  }

  getRelativePath(filePath: string) {
    return path.relative(this.root, filePath).replace(/\\/g, '/');
  }

  getAbsolutePath(relativePath: string) {
    return path.join(this.root, relativePath);
  }

  buildPublicUrl(relativePath: string) {
    const normalized = relativePath.replace(/\\/g, '/');
    return `${this.publicBaseUrl}/${normalized}`;
  }

  buildApiUrl(pathName: string) {
    const normalized = pathName.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${this.publicBaseUrl}/${normalized}`;
  }

  isS3() {
    return this.driver === 's3';
  }

  getSignedUrlExpiresSeconds() {
    return this.signedUrlExpiresSeconds;
  }

  getSignedDownloadUrl(key: string, expiresSeconds?: number) {
    if (!this.s3 || !this.s3Bucket) {
      throw new InternalServerErrorException('S3 is not configured');
    }
    const expires = expiresSeconds ?? this.signedUrlExpiresSeconds;
    return (this.s3 as any).s3.getSignedUrl('getObject', {
      Bucket: this.s3Bucket,
      Key: key.startsWith('/') ? key.slice(1) : key,
      Expires: expires,
    }) as string;
  }

  async saveUploadedFile(file: Express.Multer.File) {
    if (this.driver === 's3') {
      const upload = await this.s3?.Upload(
        {
          path: file.path,
          name: file.filename,
        },
        this.s3Prefix,
      );
      await unlink(file.path);

      if (!upload || typeof upload !== 'object') {
        throw new InternalServerErrorException('Failed to upload file to S3');
      }

      const key = (upload as any).key || (upload as any).Key;
      if (!key) {
        throw new InternalServerErrorException('Failed to resolve uploaded file key');
      }
      return key as string;
    }

    return this.getRelativePath(file.path);
  }

  async streamFile(relativePath: string, res: Response) {
    if (this.driver === 's3') {
      const data: any = await this.s3?.Download(relativePath);
      if (!data || !data.Body) {
        throw new NotFoundException('File not found');
      }
      res.setHeader('Content-Length', data.ContentLength ?? data.Body.length);
      if (data.ContentType) {
        res.setHeader('Content-Type', data.ContentType);
      }
      res.send(data.Body);
      return;
    }

    const absolutePath = this.getAbsolutePath(relativePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    const stream = createReadStream(absolutePath);
    stream.pipe(res);
  }

  private ensureDir(dirPath: string) {
    mkdirSync(dirPath, { recursive: true });
  }
}
