import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

if (process.env.NODE_ENV !== 'development') {
  require('module-alias/register');
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setBaseViewsDir(join(__dirname, '..', 'src/views'));
  app.setViewEngine('hbs');
  app.useStaticAssets(join(__dirname, '..', 'src/public'));
  await app.listen(3000);
}
bootstrap();
