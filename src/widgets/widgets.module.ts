import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { ConfigService } from '@nestjs/config';
import { ApiFootballService } from '@app/services';
import { WidgetsService } from './widgets.service';
import { FavoriteRepository, UserRepository } from '@app/repositories';
@Module({
  imports: [],
  controllers: [WidgetsController],
  providers: [ConfigService, ApiFootballService, WidgetsService, FavoriteRepository, UserRepository],
  exports: [],
})
export class WidgetsModule {}
