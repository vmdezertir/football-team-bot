import { Module } from '@nestjs/common';
import { Hears, Start, TelegrafModule, Update } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Postgres } from '@telegraf/session/pg';
import { Context, session } from 'telegraf';
import { AddTeamScene, FavoriteScene, SettingsScene } from '@app/scenes';
import { TelegramStartService } from '@app/telegram/telegram.service';
import { EScenes } from '@app/enums';
import { SceneContext } from 'telegraf/scenes';

import { HttpModule } from '@nestjs/axios';
import { ApiFootballService } from '@app/services/apiFootball.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite, User } from '@app/entities';
import { FavoriteRepository, UserRepository } from '@app/repositories';

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
    TypeOrmModule.forFeature([User, Favorite]),
  ],
  providers: [
    ConfigService,
    TelegramStartService,
    ApiFootballService,
    AddTeamScene,
    SettingsScene,
    FavoriteScene,
    FavoriteRepository,
    UserRepository,
  ],
})
@Update()
export class TelegramModule {
  constructor(private readonly service: TelegramStartService) {}

  @Start()
  async startCommand(ctx: Context) {
    return this.service.start(ctx);
  }

  @Hears('🤔 Вказати команду')
  async enterAddTeamScene(ctx: SceneContext) {
    await ctx.scene.enter(EScenes.ADD_TEAM);
  }

  @Hears('🫶🏼 Улюблені')
  async enterFavoriteScene(ctx: SceneContext) {
    await ctx.scene.enter(EScenes.FAVORITE);
  }

  @Hears('🛠️ Налаштування')
  async enterSettingsScene(ctx: SceneContext) {
    await ctx.scene.enter(EScenes.SETTINGS);
  }

  @Hears('🔄 Перезапустити')
  async restart(ctx: SceneContext) {
    await ctx.scene.reenter();
  }
}
