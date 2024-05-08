import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [WidgetsController],
  providers: [],
  exports: []
})
export class WidgetsModule {}
