import { Module } from '@nestjs/common';
import { Action, Start, TelegrafModule, Update } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Postgres } from '@telegraf/session/pg';
import { Context, session } from 'telegraf';
import { AddTeamScene } from '@app/scenes';
import { TelegramService } from '@app/telegram/telegram.service';
import { EComands } from '@app/enums';
import { SceneContext } from 'telegraf/scenes';
import { HttpModule, HttpModuleAsyncOptions } from '@nestjs/axios';
import { ApiFootballService } from '@app/services/apiFootball.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from '@app/entities';
import { FavoriteRepository } from '@app/repositories';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (confService: ConfigService) => {
        const store = Postgres({
          host: confService.get<string>('DB_HOST'),
          database: confService.get<string>('DB_NAME'),
          user: confService.get<string>('DB_USERNAME'),
          password: confService.get<string>('DB_PASSWORD'),
        });

        return {
          token: confService.get('BOT_TOKEN') as string,
          middlewares: [session({ store })],
        };
      },
      inject: [ConfigService],
    }),
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
    TypeOrmModule.forFeature([Favorite]),
  ],
  providers: [TelegramService, ApiFootballService, AddTeamScene, FavoriteRepository],
})
@Update()
export class TelegramModule {
  constructor(private readonly service: TelegramService) {}

  @Start()
  async startCommand(ctx: Context) {
    return this.service.start(ctx);
  }

  @Action(EComands.ADD_TEAM as any)
  async enterAddTeamScene(ctx: SceneContext) {
    return this.service.enterAddTeamScene(ctx);
  }
}
