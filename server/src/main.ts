import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as http from 'http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const server = app.getHttpServer();
  server.setTimeout(30000);
  console.log(server instanceof http.Server);
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
