import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('v1');
  const isDev = process.env.NODE_ENV !== 'production';
  const httpLogger = new Logger('HTTP');

  if (isDev) {
    app.use((req, res, next) => {
      const { method, originalUrl } = req;
      const start = Date.now();

      res.on('finish', () => {
        const durationMs = Date.now() - start;
        const contentLength = res.getHeader('content-length');
        httpLogger.log(
          `${method} ${originalUrl} ${res.statusCode} ${contentLength ?? 0} - ${durationMs}ms`,
        );
      });

      next();
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const config = new DocumentBuilder()
    .setTitle('Tennis Tracker API')
    .setDescription('REST API for Tennis Tracker backend')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
