import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiFootballService } from '@app/services';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: `https://${configService.get('FOOTBALL_API_HOST')}`,
        headers: {
          'x-rapidapi-host': configService.get('FOOTBALL_API_HOST'),
          'x-rapidapi-key': configService.get('FOOTBALL_API_KEY'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WidgetsController],
  providers: [ConfigService, ApiFootballService],
  exports: [],
})
export class WidgetsModule {}
