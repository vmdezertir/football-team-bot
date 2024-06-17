import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FavoriteRepository, UserRepository } from '@app/repositories';
import { ApiFootballService } from '@app/services';

import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';

@Module({
  imports: [],
  controllers: [WidgetsController],
  providers: [ConfigService, ApiFootballService, WidgetsService, FavoriteRepository, UserRepository],
  exports: [],
})
export class WidgetsModule {}
