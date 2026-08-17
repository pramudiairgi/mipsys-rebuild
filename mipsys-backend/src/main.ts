import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { StandardHttpExceptionFilter } from './common/filters/http-exception.filter';
import { appConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new StandardHttpExceptionFilter());

  app.enableCors({
    origin: appConfig.corsOrigins,
  });

  app.use('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
